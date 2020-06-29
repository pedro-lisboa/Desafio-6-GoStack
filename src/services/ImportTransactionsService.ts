import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import uploadConfig from '../config/uploads';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface RequestDTO {
  filename: string;
}

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: 'string';
}

class ImportTransactionsService {
  async execute({ filename }: RequestDTO): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const categoriesRepository = getRepository(Category);

    const filePath = path.resolve(uploadConfig.directory, filename);

    const transactions: CSVTransaction[] = [];

    const categories: string[] = [];

    const csvParser = csv({ from_line: 2 });

    const readStream = fs.createReadStream(filePath).pipe(csvParser);

    readStream.on('error', err => {
      throw new AppError(`Error opening file: ${err.message}`);
    });

    readStream.on('data', async line => {
      const [title, type, value, category] = line.map((content: string) =>
        content.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value: Number(value), category });
    });

    await new Promise(resolve => readStream.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
