import Project from '../models/Project.js';

// 1. Get All Projects (Accessible to all authenticated users)
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    // Map 'createdBy' to 'owner' so Frontend buttons/badges align
    const projectsForFrontend = projects.map(p => ({
      ...p.toObject(),
      owner: p.createdBy
    }));

    res.status(200).json(projectsForFrontend);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};

// 2. Get Single Project (Accessible to all authenticated users)
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const projectData = {
      ...project.toObject(),
      owner: project.createdBy
    };

    res.status(200).json(projectData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project", error: error.message });
  }
};

// 3. Create Project (Admin only)
export const createProject = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const userId = req.user?.id || req.user?._id || req.userId;
    const newProject = new Project({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Project name already exists." });
    }
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
};

// 4. Delete Project (Admin only)
export const deleteProject = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};

// 5. Update Project (Admin only)
export const updateProject = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedProject) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};
