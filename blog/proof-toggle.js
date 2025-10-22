document.addEventListener('DOMContentLoaded', function() {
// Toggle proof visibility
window.toggleProof = function(id) {
  const content = document.getElementById('proof-content-' + id);
  const arrow = document.getElementById('proof-arrow-' + id);

  if (content && arrow) {
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
      content.classList.remove('expanded');
      arrow.classList.remove('expanded');
    } else {
      content.classList.add('expanded');
      arrow.classList.add('expanded');
    }
  }
};
});