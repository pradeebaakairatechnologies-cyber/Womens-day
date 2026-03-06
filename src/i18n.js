import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "enrollNow": "Enroll Now",
      "eventRegistration": "Event Registration",
      "participantName": "Participant Name",
      "age": "Age",
      "phoneNumber": "Phone Number",
      "address": "Address",
      "competitionSelection": "Competition Selection",
      "group1": "Group 1",
      "group2": "Group 2",
      "group3": "Group 3",
      "cooking": "Cooking",
      "adzap": "Adzap",
      "dance": "Dance",
      "bouquetMaking": "Bouquet Making",
      "rangoli": "Rangoli",
      "fashionShow": "Fashion Show",
      "paymentAmount": "Payment Amount (₹)",
      "submitRegistration": "Submit Registration",
      "submitting": "Submitting..."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
