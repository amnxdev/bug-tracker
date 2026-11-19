import Bug from '../models/Bug.js';
import { triageBug, detectDuplicates } from '../utils/aiService.js';

// 1. Get Bugs
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
export const updateBug = async (req, res) => {
  try {
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
    res.status(500).json({ message: "Error updating bug" });
  }
};

// 4. Delete Bug
export const deleteBug = async (req, res) => {
  try {
    await Bug.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Bug deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bug" });
  }
};

// 5. Assign Bug to User (admin only)
export const assignBug = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
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
