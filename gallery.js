// Select elements
const items = document.querySelectorAll('.gallery-item img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close-btn');
const downloadBtn = document.querySelector('.download-btn');

// Show image in lightbox
items.forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightbox.style.display = 'flex';
    downloadBtn.setAttribute('data-url', img.src);
  });
});

// Close button
closeBtn.addEventListener('click', () => {
  lightbox.style.display = 'none';
});

// Download button
downloadBtn.addEventListener('click', () => {
  const imageURL = downloadBtn.getAttribute('data-url');
  const fileName = imageURL.split('/').pop();
  const a = document.createElement('a');
  a.href = imageURL;
  a.download = fileName || 'image.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Click outside image to close
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = 'none';
  }
});
