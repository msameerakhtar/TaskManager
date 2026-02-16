import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Container, Button, Box, Divider } from '@mui/material';

const Blog = () => {
  const posts = [
    { title: 'Mastering Productivity', desc: 'Tips to manage your daily tasks.', img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500', link: 'https://medium.com/topic/productivity' },
    { title: 'React Hooks Guide', desc: 'Understanding useEffect deeply.', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500', link: 'https://dev.to/t/react' },
    { title: 'Material UI Design', desc: 'Build beautiful interfaces.', img: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500', link: 'https://mui.com/blog/' },
    { title: 'The Future of AI', desc: 'How Generative AI is changing development.', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', link: 'https://openai.com/news/' },
    { title: 'Modern JavaScript', desc: 'Exploring ES2024 features and beyond.', img: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500', link: 'https://javascript.info/' },
    { title: 'Web Performance', desc: 'Optimizing your app for speed and SEO.', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', link: 'https://web.dev/blog/' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h3" textAlign="center" gutterBottom>Latest Tech Blogs</Typography>
        <Divider sx={{ width: '100px', height: '5px', bgcolor: 'primary.main', borderRadius: '10px' }} />
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {posts.map((post, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
            <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia component="img" height="180" image={post.img} sx={{ objectFit: 'cover' }} />
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>{post.title}</Typography>
                <Typography variant="body2" color="text.secondary">{post.desc}</Typography>
              </CardContent>
              <Box sx={{ p: 3, pt: 0 }}>
                <Button fullWidth variant="outlined" color="primary" component="a" href={post.link} target="_blank">
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