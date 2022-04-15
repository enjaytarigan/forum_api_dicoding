const routes = (handler) => [
  {
    path: '/threads/{threadId}/comments',
    method: 'POST',
    handler: handler.postCommentByThreadIdHandler,
    options: {
      auth: 'forum_api_jwt',
    },
  },
  {
    path: '/threads/{threadId}/comments/{commentId}',
    method: 'DELETE',
    handler: handler.deleteCommentByIdHandler,
    options: {
      auth: 'forum_api_jwt',
    },
  },
];

module.exports = routes;
