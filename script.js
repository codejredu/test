document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.categoryButton');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.textContent.toLowerCase();
            const blockCategory = document.querySelector(`.blockCategory.${category}`);

            // Hide all other block categories
            document.querySelectorAll('.blockCategory').forEach(cat => {
                if (cat !== blockCategory) {
                    cat.style.display = 'none';
                }
            });

            // Toggle display for the clicked category
            blockCategory.style.display = blockCategory.style.display === 'flex' ? 'none' : 'flex';
        });
    });
});
