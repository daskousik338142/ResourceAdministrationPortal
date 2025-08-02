const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../config/database');

// Validation schemas
const resourceSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  type: Joi.string().required().valid('equipment', 'room', 'vehicle', 'software', 'other'),
  description: Joi.string().max(500),
  availability: Joi.boolean().default(true),
  location: Joi.string().max(100),
  capacity: Joi.number().integer().min(1),
  specifications: Joi.object()
});

const updateResourceSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  type: Joi.string().valid('equipment', 'room', 'vehicle', 'software', 'other'),
  description: Joi.string().max(500),
  availability: Joi.boolean(),
  location: Joi.string().max(100),
  capacity: Joi.number().integer().min(1),
  specifications: Joi.object()
});

// GET /api/resources - Get all resources
router.get('/', (req, res) => {
  const { type, availability, search } = req.query;
  let query = {};

  if (type) {
    query.type = type;
  }

  if (availability !== undefined) {
    query.availability = availability === 'true';
  }

  db.getResourcesDB().find(query, (err, resources) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    let filteredResources = resources;

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredResources = resources.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm) ||
        (resource.description && resource.description.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      data: filteredResources,
      count: filteredResources.length
    });
  });
});

// GET /api/resources/:id - Get resource by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.getResourcesDB().findOne({ _id: id }, (err, resource) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch resource' });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      success: true,
      data: resource
    });
  });
});

// POST /api/resources - Create new resource
router.post('/', (req, res) => {
  const { error, value } = resourceSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  const newResource = {
    ...value,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.getResourcesDB().insert(newResource, (err, resource) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create resource' });
    }

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    });
  });
});

// PUT /api/resources/:id - Update resource
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { error, value } = updateResourceSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  const updateData = {
    ...value,
    updatedAt: new Date()
  };

  db.getResourcesDB().update({ _id: id }, { $set: updateData }, {}, (err, numReplaced) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update resource' });
    }

    if (numReplaced === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    db.getResourcesDB().findOne({ _id: id }, (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch updated resource' });
      }

      res.json({
        success: true,
        data: resource,
        message: 'Resource updated successfully'
      });
    });
  });
});

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.getResourcesDB().remove({ _id: id }, {}, (err, numRemoved) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete resource' });
    }

    if (numRemoved === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  });
});

module.exports = router;
