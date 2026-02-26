import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Container, Button, Box, Divider, useTheme } from '@mui/material';

const POSTS = [
    { title: 'Mastering Productivity', desc: 'Tips to manage your daily tasks.', img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500', link: 'https://medium.com/topic/productivity' },
    { title: 'React Hooks Guide', desc: 'Understanding useEffect deeply.', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500', link: 'https://dev.to/t/react' },
    { title: 'Material UI Design', desc: 'Build beautiful interfaces.', img: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500', link: 'https://mui.com/blog/' },
    { title: 'The Future of AI', desc: 'How Generative AI is changing development.', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', link: 'https://openai.com/news/' },
    { title: 'Modern JavaScript', desc: 'Exploring ES2024 features and beyond.', img: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500', link: 'https://javascript.info/' },
    { title: 'Web Performance', desc: 'Optimizing your app for speed and SEO.', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', link: 'https://web.dev/blog/' },
];

const Blog = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const cardStyle = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundImage: 'none',
        '&:hover': {
            transform: 'translateY(-10px)',
            borderColor: 'primary.main',
            boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)',
        }
    };

    return (
        <Container component="section" maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ mb: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h3" textAlign="center" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-1.5px', mb: 2 }}>
                    Latest Tech Blogs
                </Typography>
                <Divider sx={{ 
                    width: '80px', 
                    height: '4px', 
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, 
                    borderRadius: '10px', 
                    border: 'none' 
                }} />
            </Box>

            <Grid container spacing={4}>
                {POSTS.map((post, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={cardStyle}>
                            <Box sx={{ position: 'relative', overflow: 'hidden', pt: '56.25%', borderRadius: '24px 24px 0 0' }}>
                                <CardMedia 
                                    component="img" 
                                    image={post.img} 
                                    alt={post.title}
                                    loading="lazy"
                                    sx={{ 
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease',
                                        '&:hover': { transform: 'scale(1.08)' }
                                    }} 
                                />
                            </Box>
                            
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, lineHeight: 1.2 }}>
                                    {post.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                    {post.desc}
                                </Typography>
                            </CardContent>

                            <Box sx={{ p: 3, pt: 0 }}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    href={post.link} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ 
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        borderColor: 'divider',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.main' + '0D',
                                        }
                                    }}
                                >
                                    Read Full Article
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