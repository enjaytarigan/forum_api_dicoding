const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

class ThreadCommentsHandler {
  constructor(container) {
    this._container = container;
    this.postCommentByThreadIdHandler = this.postCommentByThreadIdHandler.bind(this);
    this.deleteCommentByIdHandler = this.deleteCommentByIdHandler.bind(this);
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

  async deleteCommentByIdHandler(request, h) {
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    const { threadId, commentId } = request.params;
    const { id: owner } = request.auth.credentials;
    await deleteCommentUseCase.execute({ threadId, commentId, owner });
    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }
}

module.exports = ThreadCommentsHandler;
