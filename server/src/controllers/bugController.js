import Bug from '../models/Bug.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { triageBug, detectDuplicates } from '../utils/aiService.js';

// Helper: true if user.role === 'admin' or bug.createdBy equals user._id (compare with String())
export const canModifyBug = (user, bug) => {
  if (!user || !bug) return false;
  if (user.role === 'admin') return true;
  const createdById = bug.createdBy?._id ? bug.createdBy._id : bug.createdBy;
  const userId = user._id ? user._id : user.id;
  if (!createdById || !userId) return false;
  return String(createdById) === String(userId);
};

// 1. Get Bugs for a project
export const getBugs = async (req, res) => {
  try {
    const bugs = await Bug.find({ project: req.params.projectId })
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 });

    // Map 'createdBy' to 'owner' so Frontend permissions work
    const formattedBugs = bugs.map(bug => ({
      ...bug.toObject(),
      owner: bug.createdBy
    }));

    res.status(200).json(formattedBugs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bugs", error: error.message });
  }
};

// 2. Create Bug — with AI triage + duplicate detection
export const createBug = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { title, description, priority } = req.body;

    // Run AI triage in parallel with duplicate check
    const existingBugs = await Bug.find({ project: req.params.projectId, status: { $ne: 'closed' } })
      .select('_id title description')
      .limit(20);

    const [triageResult, duplicates] = await Promise.all([
      triageBug(title, description),
      detectDuplicates(title, description, existingBugs),
    ]);

    const newBug = new Bug({
      title,
      description,
      priority: priority || 'medium',
      status: 'open',
      project: req.params.projectId,
      createdBy: userId,
      // AI-enriched fields
      aiSuggestedPriority: triageResult.suggestedPriority,
      aiEnhancedDescription: triageResult.enhancedDescription,
      aiTags: triageResult.tags,
    });

    const savedBug = await newBug.save();

    res.status(201).json({
      ...savedBug.toObject(),
      owner: savedBug.createdBy,
      // Surface AI insights to the client
      ai: {
        suggestedPriority: triageResult.suggestedPriority,
        tags: triageResult.tags,
        enhancedDescription: triageResult.enhancedDescription,
        reasoning: triageResult.reasoning,
        possibleDuplicates: duplicates,
      }
    });

  } catch (error) {
    console.error("CREATE BUG ERROR:", error);
    res.status(500).json({ message: "Error creating bug", error: error.message });
  }
};

// 3. Update Bug
// - Normal users may update only bugs they created or that are assigned to them; admins may update any.
// - Only the creator or an admin may set status to 'closed'.
export const updateBug = async (req, res) => {
  try {
    const user = req.user;
    const userId = String(user?._id || user?.id);
    const isAdmin = user?.role === 'admin';

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const isCreator = String(bug.createdBy?._id || bug.createdBy) === userId;
    const isAssigned = bug.assignedTo && String(bug.assignedTo?._id || bug.assignedTo) === userId;

    // Normal users may update only bugs they created or that are assigned to them; admins may update any
    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Only the creator or an admin may set status to 'closed'
    if (req.body.status === 'closed' && !canModifyBug(user, bug)) {
      return res.status(403).json({ message: "Forbidden: Only the creator or an admin may set status to closed" });
    }

    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTo', 'username email');

    res.status(200).json({
      ...updatedBug.toObject(),
      owner: updatedBug.createdBy
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating bug", error: error.message });
  }
};

// 4. Delete Bug — allowed only if canModifyBug. Also deletes that bug's comments.
export const deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    if (!canModifyBug(req.user, bug)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Delete that bug's comments
    await Comment.deleteMany({ bug: req.params.id });

    // Delete the bug
    await Bug.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Bug and associated comments deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bug", error: error.message });
  }
};

// 5. Assign Bug to User (Admin only)
export const assignBug = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { assignedTo } = req.body;
    let targetUserId = null;

    if (assignedTo && typeof assignedTo === 'string' && assignedTo.trim()) {
      const cleanInput = assignedTo.trim();
      if (cleanInput.match(/^[0-9a-fA-F]{24}$/)) {
        targetUserId = cleanInput;
      } else {
        const foundUser = await User.findOne({
          $or: [{ username: cleanInput }, { email: cleanInput }]
        });
        if (!foundUser) {
          return res.status(404).json({ message: `User "${cleanInput}" not found` });
        }
        targetUserId = foundUser._id;
      }
    }

    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      { assignedTo: targetUserId },
      { new: true }
    ).populate('assignedTo', 'username email');

    if (!updatedBug) return res.status(404).json({ message: "Bug not found" });

    res.status(200).json({
      ...updatedBug.toObject(),
      owner: updatedBug.createdBy
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning bug", error: error.message });
  }
};

// 6. Re-triage existing bug with AI (on-demand)
export const retriage = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });

    const triageResult = await triageBug(bug.title, bug.description);

    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      {
        aiSuggestedPriority: triageResult.suggestedPriority,
        aiEnhancedDescription: triageResult.enhancedDescription,
        aiTags: triageResult.tags,
      },
      { new: true }
    );

    res.status(200).json({
      ...updatedBug.toObject(),
      owner: updatedBug.createdBy,
      ai: triageResult,
    });
  } catch (error) {
    res.status(500).json({ message: "Error re-triaging bug", error: error.message });
  }
};
