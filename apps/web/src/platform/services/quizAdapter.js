import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { captureLead, saveLeadLocally } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const QUIZ_STORAGE_KEY = 'cote_smart_quiz';

export const saveQuizLocally = (payload) => {
  const data = {
    ...payload,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getSmartRecommendation = async (payload = {}) => {
  const quizAnswers = payload.quizAnswers || payload;
  const recommendation = recommendProducts(quizAnswers);
  saveQuizLocally({ quizAnswers, recommendation });
  await trackEvent('result_viewed', {
    sourcePage: payload.source || 'smart_quiz',
    score: recommendation.score,
    profile: recommendation.profile,
    mainProduct: recommendation.mainProduct
  });
  return recommendation;
};

export const submitSmartQuiz = async (payload = {}) => {
  const quizAnswers = payload.quizAnswers || {};
  const recommendation = payload.recommendation || recommendProducts(quizAnswers);
  const leadPayload = {
    ...payload,
    source: payload.source || 'smart_quiz',
    score: payload.score ?? recommendation.score,
    profile: payload.profile ?? recommendation.profile,
    recommendation,
    quizAnswers
  };

  saveQuizLocally(leadPayload);
  saveLeadLocally(leadPayload);
  await trackEvent('quiz_completed', {
    sourcePage: leadPayload.source,
    score: leadPayload.score,
    profile: leadPayload.profile
  });

  return captureLead(leadPayload);
};

export const quizAdapter = {
  submitSmartQuiz,
  getSmartRecommendation,
  saveQuizLocally,
  recommendProducts
};
