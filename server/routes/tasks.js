const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware for all routes
router.use(authMiddleware);

// @desc    Get all tasks for current user
// @route   GET /tasks
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { priority, completed, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (completed !== undefined && completed !== 'all') {
      filter.completed = completed === 'true';
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    const tasks = await Task.find(filter).sort(sortObj);
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single task
// @route   GET /tasks/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new task
// @route   POST /tasks
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { title, description, dueDate, priority } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const taskData = {
      title: title.trim(),
      user: req.user.id
    };

    if (description) taskData.description = description.trim();
    if (dueDate) taskData.dueDate = new Date(dueDate);
    if (priority) taskData.priority = priority;

    const task = new Task(taskData);
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update task
// @route   PUT /tasks/:id
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, completed } = req.body;

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) task.priority = priority;
    if (completed !== undefined) task.completed = completed;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete task
// @route   DELETE /tasks/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle task completion
// @route   PATCH /tasks/:id/toggle
// @access  Private
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.completed = !task.completed;
    await task.save();

    res.json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
