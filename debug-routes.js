/**
 * Debug script to check for routing errors
 * This script will analyze the routes in your Express application
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create a test app
const app = express();

// Function to check if a handler is valid
function isValidHandler(handler) {
  return typeof handler === 'function';
}

// Function to check if middleware is valid
function isValidMiddleware(middleware) {
  return typeof middleware === 'function';
}

// Test route with arrow function (problematic)
const arrowRouteHandler = (req, res) => {
  res.send('Arrow function handler');
};

// Test route with function declaration (correct)
function functionRouteHandler(req, res) {
  res.send('Function declaration handler');
}

// Test middleware with arrow function
const arrowMiddleware = (req, res, next) => {
  next();
};

// Test middleware with function declaration
function functionMiddleware(req, res, next) {
  next();
}

// Check handlers
console.log('Checking handlers:');
console.log('Arrow function handler is valid:', isValidHandler(arrowRouteHandler));
console.log('Function declaration handler is valid:', isValidHandler(functionRouteHandler));

// Check middleware
console.log('\nChecking middleware:');
console.log('Arrow function middleware is valid:', isValidMiddleware(arrowMiddleware));
console.log('Function declaration middleware is valid:', isValidMiddleware(functionMiddleware));

// Test route registration
console.log('\nTesting route registration:');
try {
  app.get('/arrow', arrowRouteHandler);
  console.log('Arrow function route registered successfully');
} catch (error) {
  console.error('Error registering arrow function route:', error.message);
}

try {
  app.get('/function', functionRouteHandler);
  console.log('Function declaration route registered successfully');
} catch (error) {
  console.error('Error registering function declaration route:', error.message);
}

// Test middleware registration
console.log('\nTesting middleware registration:');
try {
  app.use(arrowMiddleware);
  console.log('Arrow function middleware registered successfully');
} catch (error) {
  console.error('Error registering arrow function middleware:', error.message);
}

try {
  app.use(functionMiddleware);
  console.log('Function declaration middleware registered successfully');
} catch (error) {
  console.error('Error registering function declaration middleware:', error.message);
}

// Test object as handler (this will cause an error)
console.log('\nTesting object as handler:');
const objectHandler = { handler: true };
try {
  app.get('/object', objectHandler);
  console.log('WARNING: Object handler registered without error');
} catch (error) {
  console.error('Error registering object handler:', error.message);
}

// Print all registered routes
console.log('\nRegistered routes:');
app._router.stack.forEach(function(middleware) {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(middleware.route.path, middleware.route.stack[0].method);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach(function(handler) {
      if (handler.route) {
        console.log(handler.route.path, handler.route.stack[0].method);
      }
    });
  }
});

console.log('\nDebug complete. Check for any warnings or errors above.');