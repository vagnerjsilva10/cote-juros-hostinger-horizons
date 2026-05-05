import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { captureLead, saveLeadLocally } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const QUIZ_STORAGE_KEY = 'cote_smart_quiz';
export const QUIZ_PROGRESS_STORAGE_KEY = 'cote_financial_decision_funnel';

export const saveQuizLocally = (payload) => {
  const data = {
    ...payload,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getQuizProgress = () => {
  try {
    return JSON.parse(window.localStorage.getItem(QUIZ_PROGRESS_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const saveQuizProgress = (payload = {}) => {
  const current = getQuizProgress() || {};
  const data = {
    ...current,
    ...payload,
    quizAnswers: {
      ...(current.quizAnswers || {}),
      ...(payload.quizAnswers || {})
    },
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(QUIZ_PROGRESS_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getSmartRecommendation = async (payload = {}) => {
  const quizAnswers = payload.quizAnswers || payload;
  const recommendation = recommendProducts(quizAnswers);
  saveQuizLocally({ quizAnswers, recommendation });
  await trackEvent('result_viewed', {
    sourcePage: payload.source || 'smart_quiz',
    score: recommendation.score,
    profile: recommendation.profileLabel ?? recommendation.profile,
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
    profile: payload.profile ?? recommendation.profileLabel ?? recommendation.profile,
    recommendation,
    quizAnswers
  };

  saveQuizLocally(leadPayload);
  saveQuizProgress(leadPayload);
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
  saveQuizProgress,
  getQuizProgress,
  recommendProducts
};
