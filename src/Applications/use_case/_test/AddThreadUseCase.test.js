const NewThread = require('../../../Domains/threads/entities/NewThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    const useCasePayload = {
      title: 'Forum Thread',
      body: 'Back-End Expert',
      owner: 'user-123',
    };

    const expectedNewThread = new NewThread({
      id: 'thread-123',
      title: 'Forum Thread',
      owner: 'user-123',
    });

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = jest
      .fn()
      .mockImplementation(() => Promise.resolve(expectedNewThread));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const actualThread = await addThreadUseCase.execute(useCasePayload);

    expect(actualThread).toEqual(expectedNewThread);
    expect(mockThreadRepository.addThread).toBeCalledWith(useCasePayload);
  });

  it('should throw error when payload not meet data type specification', async () => {
    const badPayload = {
      owner: true,
      title: {},
      body: [],
    };

    const addThreadUseCase = new AddThreadUseCase({});
    await expect(addThreadUseCase.execute(badPayload)).rejects.toThrowError(
      'ADD_THREAD_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should throw error when payload not contain needed property', async () => {
    const addThreadUseCase = new AddThreadUseCase({});

    await expect(addThreadUseCase.execute({})).rejects.toThrowError(
      'ADD_THREAD_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });
});
