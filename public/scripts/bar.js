
const toggleBtn = document.getElementById("toggle_btn");
const sidebar = document.getElementById("sidebar");
const mainContent = document.querySelector(".main_content");

toggleBtn.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
        
        sidebar.classList.toggle("active");
    } else {
        
        sidebar.classList.toggle("hidden");
        mainContent.classList.toggle("expanded");
    }
});
