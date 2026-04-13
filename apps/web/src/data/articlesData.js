import { generatedArticles } from './generatedArticles.js';
import { wordpressMigratedArticles } from './wordpressMigratedArticles.js';

export const articlesData = [...wordpressMigratedArticles, ...generatedArticles];
