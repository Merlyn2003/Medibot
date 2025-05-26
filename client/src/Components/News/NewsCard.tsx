import React from "react";
import { Clock } from 'lucide-react';

interface NewsCardProps {
  article: {
    article_id: string;
    title: string;
    description: string;
    image_url: string;
    link: string;
    pubDate?: string;
  };
  featured?: boolean;
  index: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, featured = false, index }) => {
  // Calculate a fake reading time based on description length
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text?.split(/\s+/).length || 0;
    const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
    return `${minutes} min read`;
  };

  // Create a formatted date from pubDate
  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };

  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  const animationDelay = `${index * 0.1}s`;

  return (
    <div 
      className={`news-card ${featured ? 'news-card-featured' : ''}`}
      style={{ animationDelay }}
    >
      <div className="news-card-image-container">
        <img 
          src={article.image_url || 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=800'} 
          alt={article.title} 
          className="news-card-image"
          onError={handleImageError}
        />
        {featured && <div className="featured-badge">Featured</div>}
      </div>
      <div className="news-card-content">
        <h2 className="news-card-title">{article.title}</h2>
        <div className="news-card-meta">
          {article.pubDate && (
            <span className="news-card-date">{getFormattedDate(article.pubDate)}</span>
          )}
          <span className="news-card-reading-time">
            <Clock size={14} />
            {getReadingTime(article.description || '')}
          </span>
        </div>
        <p className="news-card-description">
          {article.description || "No description available for this article."}
        </p>
        <a 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="news-card-link"
        >
          Read Full Article
        </a>
      </div>
    </div>
  );
};

export default NewsCard;