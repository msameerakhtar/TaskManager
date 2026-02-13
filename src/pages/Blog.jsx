import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Container, Button, Box, Divider } from '@mui/material';

const Blog = () => {
  const posts = [
    { title: 'Mastering Productivity', desc: 'Tips to manage your daily tasks efficiently.', img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500', link: 'https://medium.com/topic/productivity' },
    { title: 'React Hooks Guide', desc: 'Understanding useEffect and useState deeply.', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500', link: 'https://dev.to/t/react' },
    { title: 'Material UI Design', desc: 'Build beautiful and responsive interfaces.', img: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500', link: 'https://mui.com/blog/' },
    { title: 'Web Dev Future', desc: 'Exploring the evolution of the modern web stack.', img: 'https://images.unsplash.com/photo-1550439062-609e1531270e?w=500', link: 'https://vercel.com/blog' },
    { title: 'Clean Code Tips', desc: 'Write maintainable and scalable JS code.', img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500', link: 'https://blog.cleancoder.com/' },
    { title: 'Supabase Guide', desc: 'The best backend-as-a-service for apps.', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500', link: 'https://supabase.com/blog' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      
      {/* Centered Heading */}
      <Box sx={{ mb: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h3" fontWeight="900" color="#1a237e" textAlign="center" gutterBottom>
          Latest Tech Blogs
        </Typography>
        <Divider sx={{ width: '100px', height: '5px', bgcolor: '#1a237e', borderRadius: '10px' }} />
      </Box>

      {/* 3 Boxes Per Line (md={4}) */}
      <Grid container spacing={4} justifyContent="center">
        {posts.map((post, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
            <Card 
              sx={{ 
                width: '100%',
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 4, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:hover': { 
                  transform: 'scale(1.03)', 
                  boxShadow: '0 15px 35px rgba(0,0,0,0.15)' 
                }
              }}
            >
              <CardMedia 
                component="img" 
                height="180" 
                image={post.img} 
                sx={{ objectFit: 'cover' }} 
              />
              
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="#1a237e" gutterBottom>
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {post.desc}
                </Typography>
              </CardContent>
              
              <Box sx={{ p: 3, pt: 0 }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  component="a" 
                  href={post.link} 
                  target="_blank"
                  sx={{ 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    textTransform: 'none',
                    borderColor: '#1a237e',
                    color: '#1a237e',
                    borderWidth: '2px',
                    '&:hover': { 
                      bgcolor: '#1a237e', 
                      color: 'white', 
                      borderWidth: '2px' 
                    }
                  }}
                >
                  Read More
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Blog;