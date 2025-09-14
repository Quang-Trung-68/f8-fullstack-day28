// Lấy các phần tử DOM cho chức năng tìm user
const findUserBtn = document.querySelector(".find-user");
const userIdInput = document.querySelector(".user-id-input");
const userName = document.querySelector(".user-name");
const userEmail = document.querySelector(".user-email");
const userPhone = document.querySelector(".user-phone");
const userWebsite = document.querySelector(".user-website");
const userCompany = document.querySelector(".user-company");
const userAddress = document.querySelector(".user-address");
const findUserError = document.querySelector(".find-user-error");
const findUserRetry = document.querySelector(".find-user-retry");
const userResult = document.querySelector(".user-result");

// Lấy các phần tử DOM cho chức năng posts
const postsList = document.querySelector(".posts-list");
const postError = document.querySelector(".post-error");
const postRetry = document.querySelector(".post-retry");
const loadMoreBtn = document.querySelector(".load-more-btn");

// Lấy các phần tử DOM cho chức năng todo
const numberTodo = document.querySelector(".number-todo");
const userIdInputTodo = document.querySelector(".user-id-input-todo");
const todoList = document.querySelector(".todo-list");
const todoError = document.querySelector(".todo-error");
const todoRetry = document.querySelector(".todo-retry");
const loadTodoBtn = document.querySelector(".load-todo-btn");
const allTodoBtn = document.querySelector(".all-todo-btn");
const completeTodoBtn = document.querySelector(".complete-todo-btn");
const incompleteTodoBtn = document.querySelector(".incomplete-todo-btn");

// Các biến toàn cục
const loadingOverlay = document.querySelector(".loading-overlay");
const baseUrl = "https://jsonplaceholder.typicode.com";
let todoData = null;
let currentPostsLoaded = 5;

// Hàm gửi request với Promise wrapper cho XHR
function sendRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    // Hiện loading overlay
    loadingOverlay.style.display = "flex";

    // Xử lý khi request thành công
    xhr.onload = function () {
      loadingOverlay.style.display = "none";
      
      if (this.status >= 200 && this.status < 400) {
        try {
          const data = JSON.parse(this.responseText);
          resolve(data);
        } catch (parseError) {
          reject(new Error("Lỗi parse JSON: " + parseError.message));
        }
      } else {
        // Xử lý các loại lỗi khác nhau
        if (this.status === 404) {
          reject(new Error("Không tìm thấy dữ liệu (404)"));
        } else if (this.status === 500) {
          reject(new Error("Lỗi server (500)"));
        } else if (this.status >= 400 && this.status < 500) {
          reject(new Error("Lỗi client (" + this.status + ")"));
        } else if (this.status >= 500) {
          reject(new Error("Lỗi server (" + this.status + ")"));
        } else {
          reject(new Error("Request failed with status: " + this.status));
        }
      }
    };

    // Xử lý lỗi mạng
    xhr.onerror = function () {
      loadingOverlay.style.display = "none";
      reject(new Error("Lỗi mạng - Kiểm tra kết nối internet"));
    };

    // Xử lý timeout
    xhr.ontimeout = function () {
      loadingOverlay.style.display = "none";
      reject(new Error("Request timeout - Kết nối quá chậm"));
    };

    // Set timeout 10 giây
    xhr.timeout = 10000;

    xhr.send();
  });
}

// Hàm gửi request với cơ chế retry
function sendRequestWithRetry(method, url, retryElement = null, maxRetries = 1) {
  let retryCount = 0;

  function attemptRequest() {
    // Hiển thị thông tin retry
    if (retryElement && retryCount > 0) {
      retryElement.textContent = `Đang thử lại lần ${retryCount}/${maxRetries}...`;
    }

    return sendRequest(method, url).catch((error) => {
      if (retryCount < maxRetries) {
        retryCount++;
        
        // Hiển thị thông báo retry
        if (retryElement) {
          retryElement.textContent = `Lỗi! Sẽ thử lại sau 2 giây... (Lần ${retryCount}/${maxRetries})`;
        }
        
        // Chờ 2 giây trước khi retry
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(attemptRequest());
          }, 2000);
        });
      } else {
        // Nếu đã thử hết số lần cho phép
        if (retryElement) {
          retryElement.textContent = `Đã thử ${maxRetries + 1} lần, vẫn thất bại!`;
        }
        throw error;
      }
    });
  }

  // Thực hiện request và hiển thị thông báo thành công
  return attemptRequest().then((result) => {
    if (retryElement) {
      retryElement.textContent = retryCount > 0 ? `Thành công sau ${retryCount} lần thử lại!` : "";
    }
    return result;
  });
}

// Hàm hiển thị thông tin user
function displayUser(data) {
  userName.textContent = data ? "Name: " + data.name : "";
  userEmail.textContent = data ? "Email: " + data.email : "";
  userPhone.textContent = data ? "Phone: " + data.phone : "";
  userWebsite.textContent = data ? "Website: " + data.website : "";
  userCompany.textContent = data ? "Company: " + data.company.name : "";
  userAddress.textContent = data
    ? "Address: " + data.address.street + ", " + data.address.city
    : "";
}

// Hàm xóa thông báo lỗi user
function clearUserError() {
  findUserError.textContent = "";
  findUserRetry.textContent = "";
}

// Sự kiện click nút tìm user
findUserBtn.addEventListener("click", () => {
  // Kiểm tra input có giá trị không
  if (!userIdInput.value) {
    findUserError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  // Xóa lỗi cũ và reset display
  clearUserError();
  displayUser(null);

  // Gửi request lấy thông tin user
  const url = `${baseUrl}/users/${userIdInput.value}`;

  sendRequestWithRetry("GET", url, findUserRetry)
    .then((data) => {
      displayUser(data);
    })
    .catch((error) => {
      findUserError.textContent = error.message;
      console.log(error);
    });
});

// Hàm load comments cho một post với Promise chain
function loadComments(userId, postId) {
  const urlUser = `${baseUrl}/users/${userId}`;
  const urlComments = `${baseUrl}/posts/${postId}/comments`;

  // Promise chain để tránh callback hell - gọi API lấy user trước
  return sendRequestWithRetry("GET", urlUser, postRetry)
    .then((userData) => {
      // Sau khi có userData, gọi API lấy comments
      return sendRequestWithRetry("GET", urlComments, postRetry).then(
        (commentsData) => {
          // Trả về cả userData và commentsData
          return { userData, commentsData };
        }
      );
    })
    .then(({ userData, commentsData }) => {
      // Tìm div của post
      const postDiv = document.querySelector(`.post-id-${postId}`);

      // Xóa comments cũ nếu có
      let oldComments = postDiv.querySelector(".comments");
      if (oldComments) oldComments.remove();

      // Tạo container cho comments
      const commentsContainer = document.createElement("div");
      commentsContainer.className = "comments";

      // Hiển thị thông tin user
      const userInfo = document.createElement("div");
      userInfo.className = "comment-userinfo";
      userInfo.textContent = `User: ${userData.name} (${userData.email})`;
      commentsContainer.appendChild(userInfo);

      // Hiển thị từng comment
      commentsData.forEach((comment) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.textContent = `${comment.name} (email: ${comment.email}): ${comment.body}`;
        commentsContainer.appendChild(commentDiv);
      });

      // Thêm comments vào post
      postDiv.appendChild(commentsContainer);
    })
    .catch((error) => {
      postError.textContent = error.message;
      console.log(error);
    });
}

// Hàm hiển thị danh sách posts với thông tin user
function displayPosts(posts) {
  // Tạo Promise array để lấy thông tin user cho từng post
  const postPromises = posts.map((post) => {
    const urlUser = `${baseUrl}/users/${post.userId}`;
    return sendRequestWithRetry("GET", urlUser, postRetry)
      .then((userData) => {
        // Trả về HTML string cho post này kèm thông tin user
        return `<div class="post-id-${post.id}">
                      <div class="post-userid">UserID: ${post.userId}</div>
                      <div class="post-user-name">Name: ${userData.name}</div>
                      <div class="post-user-email">Email: ${userData.email}</div>
                      <div class="post-id">ID: ${post.id}</div>
                      <div class="post-title">Title: ${post.title}</div>
                      <div class="post-body">Body: ${post.body}</div>
                      <button type="button" class="comment-btn" data-post-id="${post.id}" data-user-id="${post.userId}">Xem comments</button>
                  </div>`;
      })
      .catch((error) => {
        // Nếu không lấy được thông tin user, vẫn hiển thị post
        console.log("Không thể lấy thông tin user:", error);
        return `<div class="post-id-${post.id}">
                      <div class="post-userid">UserID: ${post.userId}</div>
                      <div class="post-user-name">Name: Không xác định</div>
                      <div class="post-user-email">Email: Không xác định</div>
                      <div class="post-id">ID: ${post.id}</div>
                      <div class="post-title">Title: ${post.title}</div>
                      <div class="post-body">Body: ${post.body}</div>
                      <button type="button" class="comment-btn" data-post-id="${post.id}" data-user-id="${post.userId}">Xem comments</button>
                  </div>`;
      });
  });

  // Chờ tất cả Promise hoàn thành và join HTML
  return Promise.all(postPromises).then((htmlArray) => {
    return htmlArray.join("");
  });
}

// Hàm gắn sự kiện click cho các nút comment
function bindCommentEvents() {
  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = btn.dataset.postId;
      const userId = btn.dataset.userId;
      loadComments(userId, postId);
    });
  });
}

// Hàm load posts
function loadPosts(limit = 5, append = false) {
  // Reset thông báo lỗi
  postError.textContent = "";
  postRetry.textContent = "";

  const url = `${baseUrl}/posts?_limit=${limit}`;

  // Gửi request lấy posts
  sendRequestWithRetry("GET", url, postRetry)
    .then((posts) => {
      // Tạo HTML với thông tin user và hiển thị
      return displayPosts(posts);
    })
    .then((postsHTML) => {
      if (append) {
        postsList.innerHTML += postsHTML;
      } else {
        postsList.innerHTML = postsHTML;
      }
      
      // Gắn sự kiện cho các nút comment
      bindCommentEvents();
    })
    .catch((error) => {
      postError.textContent = error.message;
      console.log(error);
    });
}

// Sự kiện click nút load more posts
loadMoreBtn.addEventListener("click", () => {
  currentPostsLoaded += 5;
  loadPosts(currentPostsLoaded, false);
});

// Hàm hiển thị danh sách todos
function displayTodos(todos) {
  const todosHTML = todos
    .map((todo) => {
      const cls = todo.completed ? "todo-completed" : "todo-incomplete";
      return `<div class="${cls}">
                    <div>UserId: ${todo.userId}</div>
                    <div>Id: ${todo.id}</div>
                    <div>Title: ${todo.title}</div>
                    <div>Completed: ${todo.completed}</div>
                </div>`;
    })
    .join("");

  todoList.innerHTML = todosHTML;
  numberTodo.textContent = `Số todos: ${todos.length}`;
}

// Hàm load todos
function loadTodos() {
  // Kiểm tra input có giá trị không
  if (!userIdInputTodo.value) {
    todoError.textContent = "Vui lòng nhập User ID!";
    return Promise.reject(new Error("Missing User ID"));
  }

  // Reset thông báo lỗi
  todoError.textContent = "";
  todoRetry.textContent = "";

  const url = `${baseUrl}/users/${userIdInputTodo.value}/todos`;

  // Gửi request lấy todos
  return sendRequestWithRetry("GET", url, todoRetry)
    .then((data) => {
      // Lưu data và hiển thị
      todoData = data;
      displayTodos(data);
      return data;
    })
    .catch((error) => {
      todoError.textContent = error.message;
      console.log(error);
      throw error;
    });
}

// Hàm filter todos với Promise
function filterTodos(filterFn) {
  // Nếu chưa có data thì load trước
  if (!todoData) {
    return loadTodos().then(() => {
      if (todoData) {
        const filteredTodos = todoData.filter(filterFn);
        displayTodos(filteredTodos);
      }
    });
  } else {
    // Filter và hiển thị ngay
    const filteredTodos = todoData.filter(filterFn);
    displayTodos(filteredTodos);
    return Promise.resolve();
  }
}

// Các sự kiện cho todo buttons
loadTodoBtn.addEventListener("click", loadTodos);

allTodoBtn.addEventListener("click", () => {
  filterTodos((todo) => todo);
});

completeTodoBtn.addEventListener("click", () => {
  filterTodos((todo) => todo.completed);
});

incompleteTodoBtn.addEventListener("click", () => {
  filterTodos((todo) => !todo.completed);
});

// Load posts ban đầu khi trang được tải
loadPosts(5);