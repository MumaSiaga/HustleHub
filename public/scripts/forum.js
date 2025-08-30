document.addEventListener("DOMContentLoaded", () => {
    const newPostBtn = document.querySelector(".new-post-btn");
    const newPostForm = document.querySelector(".new-post-form");
    const submitPostBtn = document.querySelector(".submit-post-btn");
    const postsList = document.querySelector(".posts-list");

    // Toggle New Post Form
    newPostBtn.addEventListener("click", () => {
        newPostForm.style.display = newPostForm.style.display === "flex" ? "none" : "flex";
    });

    // Submit New Post
    submitPostBtn.addEventListener("click", () => {
        const titleInput = document.querySelector(".post-title-input");
        const contentInput = document.querySelector(".post-content-input");

        if (!titleInput.value || !contentInput.value) return;

        const newPost = document.createElement("article");
        newPost.className = "post-card";
        newPost.innerHTML = `
            <section class="post-header">
                <img src="../../visuals/user_profile.webp" alt="User Avatar">
                <section class="post-meta">
                    <h3>${titleInput.value}</h3>
                    <p>Posted by You · just now</p>
                </section>
            </section>
            <p class="post-content">${contentInput.value}</p>
            <section class="post-actions">
                <section class="action-buttons">
                    <button class="toggle-comment-btn"><span class="material-symbols-outlined">chat_bubble_outline</span> Comment</button>
                </section>
                <span>0 replies</span>
            </section>
            <section class="comments">
                <div class="comment-list"></div>
                <div class="add-comment">
                    <input type="text" placeholder="Add a comment..." class="comment-input">
                    <button class="submit-comment-btn">Submit</button>
                </div>
            </section>
        `;

        postsList.prepend(newPost);
        titleInput.value = "";
        contentInput.value = "";
        newPostForm.style.display = "none";

        bindPostEvents(newPost);
    });

    // Bind Comment toggle & Submit events
    function bindPostEvents(post) {
        const toggleBtn = post.querySelector(".toggle-comment-btn");
        const commentsSection = post.querySelector(".comments");
        const submitCommentBtn = post.querySelector(".submit-comment-btn");
        const commentInput = post.querySelector(".comment-input");
        const commentList = post.querySelector(".comment-list");

        toggleBtn.addEventListener("click", () => {
            commentsSection.classList.toggle("active");
        });

        submitCommentBtn.addEventListener("click", () => {
            if (!commentInput.value) return;

            const comment = document.createElement("div");
            comment.className = "comment";
            comment.textContent = commentInput.value;

            commentList.appendChild(comment);
            commentInput.value = "";
        });
    }

    // Bind events to existing posts
    document.querySelectorAll(".post-card").forEach(bindPostEvents);
});
