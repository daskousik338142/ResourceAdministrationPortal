console.log('Starting server...');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

try {
  const express = require('express');
  console.log('Express loaded successfully');
  
  const app = express();
  const PORT = 5001;
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
  });
  
  app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Error starting server:', error);
}
