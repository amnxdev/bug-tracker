import Comment from '../models/Comment.js';

// 1. Add Comment to a Bug
export const addComment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = new Comment({
      text: text.trim(),
      bug: req.params.bugId,
      createdBy: userId,
    });

    const saved = await comment.save();
    const populated = await saved.populate('createdBy', 'username');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

// 2. Get all Comments for a Bug
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ bug: req.params.bugId })
      .populate('createdBy', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error: error.message });
  }
};

// 3. Delete a Comment (owner or admin)
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!isAdmin && comment.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error: error.message });
  }
};
