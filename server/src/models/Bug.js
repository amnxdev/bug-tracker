import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  // LINK TO THE PROJECT
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  // WHO CREATED IT
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // WHO IT IS ASSIGNED TO (admin can assign)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // AI-generated fields (paper gap: AI triage)
  aiSuggestedPriority: {
    type: String,
    enum: ['low', 'medium', 'high', null],
    default: null
  },
  aiEnhancedDescription: {
    type: String,
    default: null
  },
  aiTags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Bug = mongoose.model('Bug', bugSchema);
export default Bug;