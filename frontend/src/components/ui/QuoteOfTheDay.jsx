import { useState, useEffect } from 'react';
import styles from './QuoteOfTheDay.module.css';

const quotes = [
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", author: "Flora Lewis" },
  { text: "To have another language is to possess a second soul.", author: "Charlemagne" },
  { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
  { text: "Language is the road map of a culture. It tells you where its people come from and where they are going.", author: "Rita Mae Brown" },
  { text: "You can never understand one language until you understand at least two.", author: "Geoffrey Willans" },
  { text: "The more languages you know, the more you are human.", author: "Tomáš Garrigue Masaryk" },
  { text: "A different language is a different vision of life.", author: "Federico Fellini" },
  { text: "Knowledge of languages is the doorway to wisdom.", author: "Roger Bacon" },
  { text: "Language is the blood of the soul into which thoughts run and out of which they grow.", author: "Oliver Wendell Holmes" },
  { text: "Those who know nothing of foreign languages know nothing of their own.", author: "Johann Wolfgang von Goethe" },
  { text: "Language exerts hidden power, like the moon on the tides.", author: "Rita Mae Brown" },
  { text: "The conquest of learning is achieved through the knowledge of languages.", author: "Roger Bacon" },
  { text: "A new language is a new life.", author: "Persian Proverb" },
  { text: "Language is the armory of the human mind, and at once contains the trophies of its past and the weapons of its future conquests.", author: "Samuel Taylor Coleridge" },
  { text: "With languages, you are at home anywhere.", author: "Edward De Waal" },
  { text: "Language is the means of getting an idea from my brain into yours without surgery.", author: "Mark Amidon" },
  { text: "If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.", author: "Nelson Mandela" },
  { text: "A special kind of beauty exists which is born in language, of language, and for language.", author: "Gaston Bachelard" },
  { text: "Language shapes the way we think, and determines what we can think about.", author: "Benjamin Lee Whorf" },
  { text: "The greatest companion is a loyal friend; the greatest friend is language.", author: "Unknown" },
  { text: "Words are the most powerful drug used by mankind.", author: "Rudyard Kipling" },
  { text: "Language is the light of the mind.", author: "John Stuart Mill" },
  { text: "To learn a language is to have one more window from which to look at the world.", author: "Chinese Proverb" },
  { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Language is not a genetic gift, it is a social gift. Learning a new language is becoming a member of the club – the community of speakers of that language.", author: "Frank Smith" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't come from what you do occasionally. It comes from what you do consistently.", author: "Marie Forleo" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Every day is a new opportunity to learn and grow.", author: "Unknown" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" }
];

const QuoteOfTheDay = () => {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('quoteOfTheDay');
    if (stored) {
      try {
        const { date, quoteData } = JSON.parse(stored);
        if (date === today && quoteData && quoteData.text) {
          setQuote(quoteData);
          return;
        }
      } catch (e) {
        console.error('Lỗi đọc localStorage quote:', e);
      }
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const newQuote = quotes[randomIndex];
    localStorage.setItem('quoteOfTheDay', JSON.stringify({ date: today, quoteData: newQuote }));
    setQuote(newQuote);
  }, []);

  if (!quote) return null; // hoặc có thể hiển thị loading nếu muốn

  return (
    <div className={styles.quoteBox}>
      <div className={styles.quoteIcon}>💡</div>
      <div className={styles.quoteContent}>
        <p className={styles.quoteText}>“{quote.text}”</p>
        <p className={styles.quoteAuthor}>— {quote.author}</p>
      </div>
    </div>
  );
};

export default QuoteOfTheDay;