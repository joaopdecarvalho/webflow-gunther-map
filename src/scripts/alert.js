// Example Alert Script
// This demonstrates how scripts work in the Webflow Scripts system

console.log('Alert script loaded');

// Show an alert after 5 seconds to confirm everything is working
setTimeout(() => {
  console.log('Alert will show in 5 seconds...');
  alert('🎉 Webflow Scripts is working! You can now edit this script locally and see changes instantly.');
}, 5000);