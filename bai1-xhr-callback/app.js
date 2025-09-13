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

const postsList = document.querySelector(".posts-list");
const postError = document.querySelector(".post-error");
const postRetry = document.querySelector(".post-retry");
const loadMoreBtn = document.querySelector(".load-more-btn");

const numberTodo = document.querySelector(".number-todo");
const userIdInputTodo = document.querySelector(".user-id-input-todo");
const todoList = document.querySelector(".todo-list");
const todoError = document.querySelector(".todo-error");
const todoRetry = document.querySelector(".todo-retry");
const allTodoBtn = document.querySelector(".all-todo-btn");
const completeTodoBtn = document.querySelector(".complete-todo-btn");
const incompleteTodoBtn = document.querySelector(".incomplete-todo-btn");

const loadingOverlay = document.querySelector(".loading-overlay");
const baseUrl = "https://jsonplaceholder.typicode.com";

let todoData = null;
let currentPostsLoaded = 5;

// Core XHR function với error handling
function send(method, url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);

  loadingOverlay.style.display = "flex";

  xhr.onload = function () {
    loadingOverlay.style.display = "none";
    if (this.status >= 200 && this.status < 400) {
      const data = JSON.parse(this.responseText);
      callback(null, data);
    } else {
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

  xhr.onerror = function () {
    loadingOverlay.style.display = "none";
    callback(new Error("Lỗi mạng - Kiểm tra kết nối internet"), null);
  };

  xhr.send();
}

// Retry mechanism với callback
function sendWithRetry(
  method,
  url,
  callback,
  retryElement = null,
  maxRetries = 1
) {
  let retryCount = 0;

  function attemptRequest() {
    if (retryElement && retryCount > 0) {
      retryElement.textContent =
        "Đang thử lại lần " + retryCount + "/" + maxRetries + "...";
    }

    send(method, url, function (error, data) {
      if (error && retryCount < maxRetries) {
        retryCount++;
        if (retryElement) {
          retryElement.textContent =
            "Lỗi! Sẽ thử lại sau 2 giây... (Lần " +
            retryCount +
            "/" +
            maxRetries +
            ")";
        }
        setTimeout(attemptRequest, 2000);
      } else {
        if (retryElement) {
          if (error) {
            retryElement.textContent =
              "Đã thử " + (maxRetries + 1) + " lần, vẫn thất bại!";
          } else {
            retryElement.textContent =
              retryCount > 0
                ? "Thành công sau " + retryCount + " lần thử lại!"
                : "";
          }
        }
        callback(error, data);
      }
    });
  }

  attemptRequest();
}

// 1.1 User Profile Card
function callbackUser(error, data) {
  userName.textContent = "";
  userEmail.textContent = "";
  userPhone.textContent = "";
  userWebsite.textContent = "";
  userCompany.textContent = "";
  userAddress.textContent = "";
  findUserError.textContent = "";

  if (data) {
    userName.textContent = "Name: " + data.name;
    userEmail.textContent = "Email: " + data.email;
    userPhone.textContent = "Phone: " + data.phone;
    userWebsite.textContent = "Website: " + data.website;
    userCompany.textContent = "Company: " + data.company.name;
    userAddress.textContent =
      "Address: " + data.address.street + ", " + data.address.city;
  } else if (error) {
    findUserError.textContent = error.message;
    console.log(error);
  }
}

findUserBtn.addEventListener("click", function () {
  if (!userIdInput.value) {
    findUserError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  findUserError.textContent = "";
  findUserRetry.textContent = "";

  const url = baseUrl + "/users/" + userIdInput.value;
  sendWithRetry("GET", url, callbackUser, findUserRetry);
});

// 1.2 Posts với Comments
function onLoadComments(userId, postId) {
  const urlUser = baseUrl + "/users/" + userId;
  const urlComments = baseUrl + "/posts/" + postId + "/comments";

  sendWithRetry(
    "GET",
    urlUser,
    function (errorUser, dataUser) {
      if (errorUser) {
        postError.textContent = errorUser.message;
        console.log(errorUser);
      } else {
        sendWithRetry(
          "GET",
          urlComments,
          function (errorCmt, dataComments) {
            if (errorCmt) {
              postError.textContent = errorCmt.message;
              console.log(errorCmt);
            } else {
              const postDiv = document.querySelector(".post-id-" + postId);

              let oldComments = postDiv.querySelector(".comments");
              if (oldComments) oldComments.remove();

              const commentsContainer = document.createElement("div");
              commentsContainer.className = "comments";

              const userInfo = document.createElement("div");
              userInfo.className = "comment-userinfo";
              userInfo.textContent =
                "User: " + dataUser.name + " (" + dataUser.email + ")";
              commentsContainer.appendChild(userInfo);

              dataComments.forEach(function (cmt) {
                const cmtDiv = document.createElement("div");
                cmtDiv.className = "comment";
                cmtDiv.textContent = cmt.name + ": " + cmt.body;
                commentsContainer.appendChild(cmtDiv);
              });

              postDiv.appendChild(commentsContainer);
            }
          },
          postRetry
        );
      }
    },
    postRetry
  );
}

function callbackPosts(error, data) {
  if (data) {
    const postsHTML = data
      .map(function (post) {
        return (
          '<div class="post-id-' +
          post.id +
          '">' +
          '<div class="post-userid">UserID: ' +
          post.userId +
          "</div>" +
          '<div class="post-id">ID: ' +
          post.id +
          "</div>" +
          '<div class="post-title">Title: ' +
          post.title +
          "</div>" +
          '<div class="post-body">Body: ' +
          post.body +
          "</div>" +
          '<button type="button" class="comment-btn" data-post-id="' +
          post.id +
          '" data-user-id="' +
          post.userId +
          '">Xem comments</button>' +
          "</div>"
        );
      })
      .join("");

    postsList.innerHTML = postsHTML;

    document.querySelectorAll(".comment-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const postId = btn.dataset.postId;
        const userId = btn.dataset.userId;
        onLoadComments(userId, postId);
      });
    });
  } else if (error) {
    postError.textContent = error.message;
    console.log(error);
  }
}

function loadPosts(limit) {
  postError.textContent = "";
  postRetry.textContent = "";

  const urlPosts = baseUrl + "/posts?_limit=" + limit;
  sendWithRetry("GET", urlPosts, callbackPosts, postRetry);
}

loadMoreBtn.addEventListener("click", function () {
  currentPostsLoaded += 5;
  loadPosts(currentPostsLoaded);
});

// 1.3 Todo List
function displayTodos(todos) {
  const htmlTodos = todos
    .map(function (todo) {
      const cls = todo.completed ? "todo-completed" : "todo-incomplete";
      return (
        '<div class="' +
        cls +
        '">' +
        "<div>UserId: " +
        todo.userId +
        "</div>" +
        "<div>Id: " +
        todo.id +
        "</div>" +
        "<div>Title: " +
        todo.title +
        "</div>" +
        "<div>Completed: " +
        todo.completed +
        "</div>" +
        "</div>"
      );
    })
    .join("");

  todoList.innerHTML = htmlTodos;
  numberTodo.textContent = todos.length;
}

function onLoadTodo() {
  if (!userIdInputTodo.value) {
    todoError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  todoError.textContent = "";
  todoRetry.textContent = "";

  const urlTodos = baseUrl + "/users/" + userIdInputTodo.value + "/todos";
  sendWithRetry(
    "GET",
    urlTodos,
    function (error, data) {
      if (error) {
        todoError.textContent = error.message;
        console.log(error);
      } else {
        todoData = data;
        displayTodos(data);
      }
    },
    todoRetry
  );
}

allTodoBtn.addEventListener("click", onLoadTodo);

completeTodoBtn.addEventListener("click", function () {
  if (!todoData) {
    onLoadTodo();
    return;
  }
  const completedTodos = todoData.filter(function (todo) {
    return todo.completed;
  });
  displayTodos(completedTodos);
});

incompleteTodoBtn.addEventListener("click", function () {
  if (!todoData) {
    onLoadTodo();
    return;
  }
  const incompleteTodos = todoData.filter(function (todo) {
    return !todo.completed;
  });
  displayTodos(incompleteTodos);
});

// Initial load
loadPosts(5);
