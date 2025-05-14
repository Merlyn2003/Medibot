import React, { useEffect, useState } from 'react';
import './News.css';
import Navbar from '../Navbar/Navbar';
import NewsGrid from './NewsGrid.tsx';
import { Search } from 'lucide-react';

const News: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('health');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://newsdata.io/api/1/latest?apikey=pub_69005aabb1da9139472c126aa243eea512183&q=${searchTerm}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        setError('No articles found. Try a different search term.');
        setLoading(false);
        return;
      }
      
      const newArticles = data.results.filter(
        (article: any, index: number, self: any[]) => 
          article.title && 
          index === self.findIndex(a => a.title === article.title)
      );
      
      if (page === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prevArticles => [...prevArticles, ...newArticles]);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setError('Failed to load news. Please try again later.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (document.getElementById('search-input') as HTMLInputElement);
    if (input && input.value) {
      setSearchTerm(input.value);
      setPage(1);
    }
  };

  return (
    <div className="news-page">
      <Navbar />
      
      <div className="news-hero">
        <div className="news-hero-content">
          <h1 className="news-hero-title">Health News Digest</h1>
          <p className="news-hero-subtitle">
            Stay informed with the latest updates on health, wellness, and medical breakthroughs
          </p>
          
          <form className="news-search-container" onSubmit={handleSearch}>
            <input 
              type="text" 
              id="search-input"
              placeholder="Search health topics..." 
              className="news-search-input"
              defaultValue={searchTerm}
            />
            <button type="submit" className="news-search-button">
              <Search size={18} />
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>
      
      <div className="news-content-container">
        {error ? (
          <div className="news-error">
            <p>{error}</p>
            <button onClick={() => fetchNews()} className="news-retry-btn">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <NewsGrid articles={articles} loading={loading} />
            
            <div className="news-load-more">
              <button 
                onClick={() => setPage(prev => prev + 1)} 
                className="news-load-more-btn" 
                disabled={loading}
              >
                {loading ? "Loading more articles..." : "Load More Articles"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default News;