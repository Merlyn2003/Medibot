import React from 'react';
import NewsCard from './NewsCard.tsx';

interface NewsGridProps {
  articles: any[];
  loading: boolean;
}

const NewsGrid: React.FC<NewsGridProps> = ({ articles, loading }) => {
  if (articles.length === 0 && loading) {
    return <NewsGridSkeleton />;
  }

  // Determine featured articles (first 2)
  const featuredArticles = articles.slice(0, 2);
  const regularArticles = articles.slice(2);

  return (
    <div className="news-grid-container">
      {featuredArticles.length > 0 && (
        <div className="news-featured-section">
          {featuredArticles.map((article, index) => (
            <NewsCard 
              key={article.article_id || index} 
              article={article} 
              featured={true}
              index={index}
            />
          ))}
        </div>
      )}
      
      <div className="news-regular-grid">
        {regularArticles.map((article, index) => (
          <NewsCard 
            key={article.article_id || index + 2} 
            article={article}
            index={index + 2}
          />
        ))}
      </div>
      
      {loading && <NewsGridSkeleton count={3} />}
    </div>
  );
};

// Skeleton loader for news grid
const NewsGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="news-skeleton-grid">
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="news-skeleton-card">
          <div className="news-skeleton-image"></div>
          <div className="news-skeleton-content">
            <div className="news-skeleton-title"></div>
            <div className="news-skeleton-meta"></div>
            <div className="news-skeleton-description"></div>
            <div className="news-skeleton-link"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsGrid;