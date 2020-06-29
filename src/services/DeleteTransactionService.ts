import { getCustomRepository } from 'typeorm';
import { isUuid } from 'uuidv4';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    const validUuid = isUuid(id);

    if (!validUuid) {
      throw new AppError('Invalid Id.');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne({ id });

    // Verify if DB found a registry
    if (!transaction) {
      throw new AppError('Transaction not found.');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
