export function spawnConfetti(count = 50) {
  if (typeof document === 'undefined') return;
  const colors = ['#00B4D8', '#ff00ff', '#00f5ff', '#10b981', '#f43f5e', '#00B4D8'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = -(Math.random() * 40) + 'px';
    el.style.width = (6 + Math.random() * 10) + 'px';
    el.style.height = (6 + Math.random() * 10) + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}
