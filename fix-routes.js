/**
 * Fix Routes Script
 * This script demonstrates the correct way to define route handlers in Express
 */

const express = require('express');
const app = express();

// CORRECT: Use function declarations for route handlers
app.get('/api/example', function(req, res) {
  res.json({ success: true, message: 'This is the correct way to define a route handler' });
});

// INCORRECT: Using an object as a route handler
// This will cause the "Route.get() requires a callback function but got a [object Object]" error
// app.get('/api/wrong', { handler: true });

// CORRECT: Use function declarations for middleware
app.use(function(req, res, next) {
  console.log('Request received at:', new Date());
  next();
});

// CORRECT: Multiple middleware functions
app.get('/api/multiple', 
  function(req, res, next) {
    req.value = 'first middleware';
    next();
  },
  function(req, res) {
    res.json({ 
      success: true, 
      message: 'Using multiple middleware functions', 
      value: req.value 
    });
  }
);

// CORRECT: Error handling middleware must have 4 parameters
app.use(function(err, req, res, next) {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Server error' });
});

// Start server
const PORT = 3030;
app.listen(PORT, function() {
  console.log(`Example server running on port ${PORT}`);
  console.log('Routes defined correctly!');
});