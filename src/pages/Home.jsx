import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import Toast from '../components/Toast';
import './Home.css';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbytB-Z0w0-LikTqGOYFIM-oKkdAMtEHxMGc1YK1tCxGo9AxwPSym9yb1Z4o2GXn921d/exec";
const WHATSAPP_SERVER_URL = import.meta.env.VITE_WHATSAPP_SERVER_URL || 'http://localhost:3001';

const Home = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const hasTriggeredConfetti = useRef(false);

  useEffect(() => {
    // Toggling image index every 2 seconds for the diamond cards
    const imageInterval = setInterval(() => {
      setImageIndex(prev => (prev === 0 ? 1 : 0));
    }, 2000);

    return () => clearInterval(imageInterval);
  }, []);

  useEffect(() => {
    let timer1, timer2, timer3, timer4, timer5;
    timer1 = setTimeout(() => setStep(1), 100);
    timer2 = setTimeout(() => setStep(2), 1100);
    timer3 = setTimeout(() => setStep(3), 3100);
    timer4 = setTimeout(() => setStep(4), 5100);
    timer5 = setTimeout(() => setStep(5), 7100); // Trigger final UI swap after 3 seconds of blast

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  useEffect(() => {
    if (step === 4 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      triggerConfetti();
    }
  }, [step]);

  const triggerConfetti = () => {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formElement = e.target;
    const fileInput = formElement.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    // Validation
    if (!file) {
      setToast({ message: "Payment screenshot is required!", type: "error" });
      setIsSubmitting(false);
      return;
    }

    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") {
      setToast({ message: "Please configure your GOOGLE_SCRIPT_URL at the top of Home.jsx first!", type: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Convert file to Base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Prepare form data
      const formData = new FormData(formElement);
      formData.append('base64File', base64String);
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);

      // 3. Submit to Google Sheets
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      // 4. Try to send WhatsApp confirmation (optional - won't block if server is down)
      const phone = '91' + formElement.phoneNumber.value;
      const name = formElement.participantName.value;

      try {
        // Fetch CSRF token
        const tokenRes = await fetch(`${WHATSAPP_SERVER_URL}/api/csrf-token`, {
          credentials: 'include'
        });
        
        if (!tokenRes.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        
        const { csrfToken: token } = await tokenRes.json();

        // Send WhatsApp notification
        const whatsappRes = await fetch(`${WHATSAPP_SERVER_URL}/api/send-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          body: JSON.stringify({ phone, name })
        });

        if (!whatsappRes.ok) {
          throw new Error('WhatsApp server returned error');
        }

        const whatsappData = await whatsappRes.json();
        console.log('✅ WhatsApp notification sent:', whatsappData);
        
        if (whatsappData.success) {
          setToast({
            message: "Enrollment Submitted Successfully! WhatsApp confirmation sent.",
            type: "success"
          });
        }
      } catch (whatsappError) {
        // WhatsApp notification failed, but registration still succeeded
        console.error('❌ WhatsApp notification failed:', whatsappError.message);
        setToast({
          message: "Enrollment Submitted Successfully! (WhatsApp notification failed - server may be offline)",
          type: "success"
        });
      }

      // 5. Success - Update UI
      triggerConfetti();
      setIsSubmitting(false);
      setIsModalOpen(false);
      // Toast message is set in WhatsApp try-catch block above
      formElement.reset();

    } catch (error) {
      console.error("Submission error:", error);
      setToast({
        message: "Failed to submit enrollment. Please try again.",
        type: "error"
      });
      setIsSubmitting(false);
    }
  };

  const wordAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.2, filter: "blur(10px)" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const fullPhraseAnimation = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", bounce: 0.5, duration: 1.5 }
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(5px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { type: "spring", bounce: 0.3, duration: 1 } }
  };

  const modalVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4 } },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <div className={`home-container ${isModalOpen ? 'modal-open' : ''}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* 100vh Hero Banner */}
      <div className="hero-section">
        <div className="animation-wrapper">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="happy" className="word-container" {...wordAnimation}>
                <h1 className="text-gradient happy-gradient">Happy</h1>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="womens" className="word-container" {...wordAnimation}>
                <h1 className="text-gradient womens-gradient">Women's</h1>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="day" className="word-container" {...wordAnimation}>
                <h1 className="text-gradient day-gradient">Day</h1>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="full" className="phrase-container" {...fullPhraseAnimation}>
                <h1 className="text-gradient happy-gradient inline-word">Happy</h1>
                <h1 className="text-gradient womens-gradient inline-word">Women's</h1>
                <h1 className="text-gradient day-gradient inline-word">Day</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content Rendered Smoothly Later */}
      <AnimatePresence>
        {step === 5 && (
          <motion.div
            className="final-ui-overlay"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
          >
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>

            {/* Top Logo - Not fixed, scrolls with page */}
            <div className="page-logo-container">
              <img src="/images/JCI1.png" alt="Logo" className="page-logo" />
            </div>

            {/* Quote Section */}
            <section className="quote-section">
              <p className="quote-text">
                “Celebrate your strength, share your talent, and let your voice shine this Women’s Day.”
              </p>
            </section>

            {/* Diamond Cards Section */}
            <section className="cards-section">
              <div className="cards-container">

                {/* Group 1 Card */}
                <div className="diamond-card">
                  <div className="diamond-image-container">
                    <AnimatePresence>
                      {imageIndex === 0 ? (
                        <motion.img
                          key="cooking"
                          src="/images/cooking.png"
                          alt="Cooking"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      ) : (
                        <motion.img
                          key="adzap"
                          src="/images/adzap.jpg"
                          alt="Adzap"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <h3 className="card-title">Cooking / Adzap</h3>
                </div>

                {/* Group 2 Card */}
                <div className="diamond-card">
                  <div className="diamond-image-container">
                    <AnimatePresence>
                      {imageIndex === 0 ? (
                        <motion.img
                          key="dance"
                          src="/images/dance.png"
                          alt="Dance"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      ) : (
                        <motion.img
                          key="bouquet"
                          src="/images/bouquet.webp"
                          alt="Bouquet Making"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <h3 className="card-title">Dance / Bouquet</h3>
                </div>

                {/* Group 3 Card */}
                <div className="diamond-card">
                  <div className="diamond-image-container">
                    <AnimatePresence>
                      {imageIndex === 0 ? (
                        <motion.img
                          key="rangoli"
                          src="/images/rangoli.webp"
                          alt="Rangoli"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      ) : (
                        <motion.img
                          key="fashion"
                          src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=500&q=80"
                          alt="Fashion Show"
                          className="diamond-image"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <h3 className="card-title">Rangoli / Fashion</h3>
                </div>
              </div>

              {/* Enroll Button */}
              <div className="enroll-btn-container">
                <button className="enroll-main-btn" onClick={() => setIsModalOpen(true)}>
                  {t('enrollNow')}
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <img src="/images/JCI1.png" alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
              </div>

              <h2 className="modal-title">{t('eventRegistration')}</h2>

              <form className="enroll-form" onSubmit={handleEnrollSubmit}>

                <div className="form-group">
                  <label>{t('participantName')}</label>
                  <input type="text" name="participantName" placeholder="Enter your full name" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('age')}</label>
                    <input type="number" name="age" min="5" max="100" placeholder="e.g. 24" required />
                  </div>

                  <div className="form-group">
                    <label>{t('phoneNumber')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value="+91" readOnly style={{ width: '60px', backgroundColor: 'rgba(0, 0, 0, 0.25)', color: '#c7c7c7', cursor: 'not-allowed', border: '1px solid #794d93', borderRadius: '8px', padding: '1rem 0.5rem', textAlign: 'center' }} />
                      <input type="tel" name="phoneNumber" placeholder="10-digit number" pattern="[0-9]{10}" maxLength="10" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} required style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('address')}</label>
                  <textarea rows="2" name="address" placeholder="Enter your complete address" required></textarea>
                </div>

                <div className="form-divider"></div>
                <h3 className="competition-title">{t('competitionSelection')}</h3>
                <p className="competition-subtitle">Please choose exactly one activity from each group.</p>

                <div className="competition-group">
                  <h4>{t('group1')}</h4>
                  <div className="radio-options">
                    <label className="radio-label">
                      <input type="radio" name="group1" value="Cooking" required />
                      <span className="radio-custom"></span> {t('cooking')}
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="group1" value="Adzap" required />
                      <span className="radio-custom"></span> {t('adzap')}
                    </label>
                  </div>
                </div>

                <div className="competition-group">
                  <h4>{t('group2')}</h4>
                  <div className="radio-options">
                    <label className="radio-label">
                      <input type="radio" name="group2" value="Dance" required />
                      <span className="radio-custom"></span> {t('dance')}
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="group2" value="Bouquet Making" required />
                      <span className="radio-custom"></span> {t('bouquetMaking')}
                    </label>
                  </div>
                </div>

                <div className="competition-group">
                  <h4>{t('group3')}</h4>
                  <div className="radio-options">
                    <label className="radio-label">
                      <input type="radio" name="group3" value="Rangoli" required />
                      <span className="radio-custom"></span> {t('rangoli')}
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="group3" value="Fashion Show" required />
                      <span className="radio-custom"></span> {t('fashionShow')}
                    </label>
                  </div>
                </div>

                <div className="form-divider"></div>
                <div className="form-group">
                  <label>{t('paymentAmount')}</label>
                  <input type="text" name="paymentAmount" value="200" readOnly className="readonly-input" />
                </div>

                {/* QR Code / UPI Section */}
                <div className="payment-options-container">
                  <div className="desktop-qr-payment">
                    <p className="payment-instruction">Scan to Pay via any UPI App</p>
                    <img
                      src="/images/phone.webp"
                      alt="Payment QR Code"
                      className="qr-code-img"
                    />
                  </div>

                  <div className="mobile-upi-payment">
                    <p className="payment-instruction">Copy UPI ID to Pay:</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                      <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>9597333446-2@ybl</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("9597333446-2@ybl");
                          setToast({ message: "UPI ID copied!", type: "success" });
                        }}
                        style={{
                          background: '#e91e63',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group file-upload-group">
                  <label>Upload Payment Screenshot <span className="required-star">*</span></label>
                  <p className="file-instruction">Please upload a clear screenshot of your successful transaction.</p>
                  <input type="file" name="paymentScreenshot" accept="image/*" className="file-input" required />
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? t('submitting') : t('submitRegistration')}
                </button>
                <div style={{
                  textAlign: 'center',
                  marginTop: '15px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  paddingBottom: '10px'
                }}>

                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
