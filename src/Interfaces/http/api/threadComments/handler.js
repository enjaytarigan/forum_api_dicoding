const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');

class ThreadCommentsHandler {
  constructor(container) {
    this._container = container;
    this.postCommentByThreadIdHandler = this.postCommentByThreadIdHandler.bind(this);
  }

  async postCommentByThreadIdHandler(request, h) {
    const addCommentUseCase = this._container.getInstance(
      AddCommentUseCase.name,
    );
    const useCasePayload = {
      threadId: request.params.threadId,
      owner: request.auth.credentials.id,
      ...request.payload,
    };
    const addedComment = await addCommentUseCase.execute(useCasePayload);
    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }
}

module.exports = ThreadCommentsHandler;
