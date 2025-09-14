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

// Hàm XHR cơ bản với xử lý lỗi chi tiết
function send(method, url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);

  // Hiển thị loading overlay
  loadingOverlay.style.display = "flex";

  // Xử lý khi request hoàn thành
  xhr.onload = function () {
    // Ẩn loading overlay
    loadingOverlay.style.display = "none";
    
    // Kiểm tra status code thành công
    if (this.status >= 200 && this.status < 400) {
      try {
        // Parse JSON response
        const data = JSON.parse(this.responseText);
        callback(null, data);
      } catch (parseError) {
        // Xử lý lỗi parse JSON
        callback(new Error("Lỗi parse JSON: " + parseError.message), null);
      }
    } else {
      // Xử lý các loại lỗi HTTP khác nhau
      let errorMessage;
      if (this.status === 404) {
        errorMessage = "Không tìm thấy dữ liệu (404)";
      } else if (this.status === 500) {
        errorMessage = "Lỗi server (500)";
      } else if (this.status >= 400 && this.status < 500) {
        errorMessage = "Lỗi client (" + this.status + ")";
      } else if (this.status >= 500) {
        errorMessage = "Lỗi server (" + this.status + ")";
      } else {
        errorMessage = "Request failed with status: " + this.status;
      }
      callback(new Error(errorMessage), null);
    }
  };

  // Xử lý lỗi mạng
  xhr.onerror = function () {
    loadingOverlay.style.display = "none";
    callback(new Error("Lỗi mạng - Kiểm tra kết nối internet"), null);
  };

  // Xử lý timeout
  xhr.ontimeout = function () {
    loadingOverlay.style.display = "none";
    callback(new Error("Request timeout - Kết nối quá chậm"), null);
  };

  // Set timeout 10 giây
  xhr.timeout = 10000;

  xhr.send();
}

// Hàm gửi request với cơ chế retry
function sendWithRetry(method, url, callback, retryElement = null, maxRetries = 1) {
  let retryCount = 0;

  // Hàm thực hiện request với retry logic
  function attemptRequest() {
    // Hiển thị thông báo retry
    if (retryElement && retryCount > 0) {
      retryElement.textContent = "Đang thử lại lần " + retryCount + "/" + maxRetries + "...";
    }

    // Gửi request
    send(method, url, function (error, data) {
      // Nếu có lỗi và chưa đạt max retry
      if (error && retryCount < maxRetries) {
        retryCount++;
        if (retryElement) {
          retryElement.textContent = "Lỗi! Sẽ thử lại sau 2 giây... (Lần " + retryCount + "/" + maxRetries + ")";
        }
        // Thử lại sau 2 giây
        setTimeout(attemptRequest, 2000);
      } else {
        // Hoàn thành (thành công hoặc hết retry)
        if (retryElement) {
          if (error) {
            retryElement.textContent = "Đã thử " + (maxRetries + 1) + " lần, vẫn thất bại!";
          } else {
            retryElement.textContent = retryCount > 0 ? "Thành công sau " + retryCount + " lần thử lại!" : "";
          }
        }
        callback(error, data);
      }
    });
  }

  attemptRequest();
}

// Hàm hiển thị thông tin user
function displayUser(data) {
  userName.textContent = data ? "Name: " + data.name : "";
  userEmail.textContent = data ? "Email: " + data.email : "";
  userPhone.textContent = data ? "Phone: " + data.phone : "";
  userWebsite.textContent = data ? "Website: " + data.website : "";
  userCompany.textContent = data ? "Company: " + data.company.name : "";
  userAddress.textContent = data ? "Address: " + data.address.street + ", " + data.address.city : "";
}

// Hàm xóa thông báo lỗi user
function clearUserError() {
  findUserError.textContent = "";
  findUserRetry.textContent = "";
}

// Callback xử lý dữ liệu user
function callbackUser(error, data) {
  if (data) {
    // Hiển thị thông tin user
    displayUser(data);
  } else if (error) {
    // Hiển thị lỗi
    findUserError.textContent = error.message;
    console.log(error);
  }
}

// Sự kiện click nút tìm user
findUserBtn.addEventListener("click", function () {
  // Kiểm tra input có giá trị không
  if (!userIdInput.value) {
    findUserError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  // Xóa thông báo cũ và reset display
  clearUserError();
  displayUser(null);

  // Gọi API lấy thông tin user
  const url = baseUrl + "/users/" + userIdInput.value;
  sendWithRetry("GET", url, callbackUser, findUserRetry);
});

// Hàm tải comments cho một post với nested callbacks
function onLoadComments(userId, postId) {
  const urlUser = baseUrl + "/users/" + userId;
  const urlComments = baseUrl + "/posts/" + postId + "/comments";

  // Tải thông tin user trước
  sendWithRetry("GET", urlUser, function (errorUser, dataUser) {
    if (errorUser) {
      postError.textContent = errorUser.message;
      console.log(errorUser);
    } else {
      // Sau khi có thông tin user, tải comments
      sendWithRetry("GET", urlComments, function (errorCmt, dataComments) {
        if (errorCmt) {
          postError.textContent = errorCmt.message;
          console.log(errorCmt);
        } else {
          // Tìm div của post
          const postDiv = document.querySelector(".post-id-" + postId);

          // Xóa comments cũ nếu có
          let oldComments = postDiv.querySelector(".comments");
          if (oldComments) oldComments.remove();

          // Tạo container cho comments
          const commentsContainer = document.createElement("div");
          commentsContainer.className = "comments";

          // Hiển thị thông tin user
          const userInfo = document.createElement("div");
          userInfo.className = "comment-userinfo";
          userInfo.textContent = "User: " + dataUser.name + " (" + dataUser.email + ")";
          commentsContainer.appendChild(userInfo);

          // Hiển thị từng comment
          dataComments.forEach(function (cmt) {
            const cmtDiv = document.createElement("div");
            cmtDiv.className = "comment";
            cmtDiv.textContent = cmt.name + " (email: " + cmt.email + "): " + cmt.body;
            commentsContainer.appendChild(cmtDiv);
          });

          // Thêm comments vào post
          postDiv.appendChild(commentsContainer);
        }
      }, postRetry);
    }
  }, postRetry);
}

// Hàm gắn sự kiện click cho các nút comment
function bindCommentEvents() {
  document.querySelectorAll(".comment-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const postId = btn.dataset.postId;
      const userId = btn.dataset.userId;
      onLoadComments(userId, postId);
    });
  });
}

// Hàm hiển thị posts với thông tin user (sử dụng counter để đếm completed requests)
function displayPostsWithUserInfo(posts) {
  let completedRequests = 0;
  const totalRequests = posts.length;
  const postsData = new Array(posts.length); // Mảng để lưu kết quả theo thứ tự

  // Reset error messages
  postError.textContent = "";

  // Gửi request lấy thông tin user cho từng post
  posts.forEach(function(post, index) {
    const urlUser = baseUrl + "/users/" + post.userId;
    
    sendWithRetry("GET", urlUser, function(error, userData) {
      // Lưu kết quả vào đúng vị trí trong mảng
      if (error) {
        console.log("Không thể lấy thông tin user:", error);
        // Nếu lỗi, tạo post với thông tin user mặc định
        postsData[index] = {
          post: post,
          userData: { name: "Không xác định", email: "Không xác định" }
        };
      } else {
        postsData[index] = {
          post: post,
          userData: userData
        };
      }

      completedRequests++;

      // Nếu đã hoàn thành tất cả requests, hiển thị posts
      if (completedRequests === totalRequests) {
        const postsHTML = postsData.map(function(item) {
          const post = item.post;
          const user = item.userData;
          
          return '<div class="post-id-' + post.id + '">' +
                 '<div class="post-userid">UserID: ' + post.userId + '</div>' +
                 '<div class="post-user-name">Name: ' + user.name + '</div>' +
                 '<div class="post-user-email">Email: ' + user.email + '</div>' +
                 '<div class="post-id">ID: ' + post.id + '</div>' +
                 '<div class="post-title">Title: ' + post.title + '</div>' +
                 '<div class="post-body">Body: ' + post.body + '</div>' +
                 '<button type="button" class="comment-btn" data-post-id="' + post.id + '" data-user-id="' + post.userId + '">Xem comments</button>' +
                 '</div>';
        }).join("");

        // Hiển thị posts và gắn events
        postsList.innerHTML = postsHTML;
        bindCommentEvents();
      }
    }, postRetry);
  });
}

// Callback xử lý danh sách posts
function callbackPosts(error, data) {
  if (data) {
    // Hiển thị posts với thông tin user
    displayPostsWithUserInfo(data);
  } else if (error) {
    // Hiển thị lỗi
    postError.textContent = error.message;
    console.log(error);
  }
}

// Hàm tải posts với limit
function loadPosts(limit) {
  // Xóa thông báo cũ
  postError.textContent = "";
  postRetry.textContent = "";

  // Gọi API lấy danh sách posts
  const urlPosts = baseUrl + "/posts?_limit=" + limit;
  sendWithRetry("GET", urlPosts, callbackPosts, postRetry);
}

// Sự kiện click nút load more posts
loadMoreBtn.addEventListener("click", function () {
  currentPostsLoaded += 5;
  loadPosts(currentPostsLoaded);
});

// Hàm hiển thị danh sách todos
function displayTodos(todos) {
  // Tạo HTML cho todos
  const htmlTodos = todos.map(function (todo) {
    const cls = todo.completed ? "todo-completed" : "todo-incomplete";
    return '<div class="' + cls + '">' +
           '<div>UserId: ' + todo.userId + '</div>' +
           '<div>Id: ' + todo.id + '</div>' +
           '<div>Title: ' + todo.title + '</div>' +
           '<div>Completed: ' + todo.completed + '</div>' +
           '</div>';
  }).join("");

  // Hiển thị todos và số lượng
  todoList.innerHTML = htmlTodos;
  numberTodo.textContent = "Số todos: " + todos.length;
}

// Hàm tải todos
function onLoadTodo() {
  // Kiểm tra input có giá trị không
  if (!userIdInputTodo.value) {
    todoError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  // Xóa thông báo cũ
  todoError.textContent = "";
  todoRetry.textContent = "";

  // Gọi API lấy todos
  const urlTodos = baseUrl + "/users/" + userIdInputTodo.value + "/todos";
  sendWithRetry("GET", urlTodos, function (error, data) {
    if (error) {
      todoError.textContent = error.message;
      console.log(error);
    } else {
      // Lưu data và hiển thị
      todoData = data;
      displayTodos(data);
    }
  }, todoRetry);
}

// Hàm filter todos với callback handling
function filterTodos(filterFunction, callback) {
  // Nếu chưa có data thì load trước
  if (!todoData) {
    // Set callback để load data trước khi filter
    const originalCallback = function(error, data) {
      if (error) {
        todoError.textContent = error.message;
        console.log(error);
      } else {
        todoData = data;
        // Sau khi load xong, thực hiện filter
        const filteredTodos = todoData.filter(filterFunction);
        displayTodos(filteredTodos);
        if (callback) callback();
      }
    };

    // Thực hiện load todos
    if (!userIdInputTodo.value) {
      todoError.textContent = "Vui lòng nhập User ID!";
      return;
    }

    todoError.textContent = "";
    todoRetry.textContent = "";

    const urlTodos = baseUrl + "/users/" + userIdInputTodo.value + "/todos";
    sendWithRetry("GET", urlTodos, originalCallback, todoRetry);
  } else {
    // Nếu đã có data, filter ngay
    const filteredTodos = todoData.filter(filterFunction);
    displayTodos(filteredTodos);
    if (callback) callback();
  }
}

// Các sự kiện cho todo buttons
loadTodoBtn.addEventListener("click", onLoadTodo);

allTodoBtn.addEventListener("click", function() {
  filterTodos(function(todo) { return todo; });
});

completeTodoBtn.addEventListener("click", function () {
  filterTodos(function(todo) { return todo.completed; });
});

incompleteTodoBtn.addEventListener("click", function () {
  filterTodos(function(todo) { return !todo.completed; });
});

// Load posts ban đầu khi trang được tải
loadPosts(5);