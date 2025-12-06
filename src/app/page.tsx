
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Github, Linkedin, Twitter, Mail, Code, Server, Database } from "lucide-react";
import Image from "next/image";

const projects = [
  {
    title: "Project One",
    description: "A brief description of this project, highlighting the key technologies and what I learned. This project solves a real-world problem by doing X, Y, and Z.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Firebase"],
    imageUrl: "https://picsum.photos/seed/1/600/400",
    liveUrl: "#",
    sourceUrl: "#",
    imageHint: "code laptop"
  },
  {
    title: "Project Two",
    description: "This was a team project where I was responsible for the backend. We built a scalable API using Node.js and deployed it on AWS.",
    tags: ["Node.js", "Express", "PostgreSQL", "AWS"],
    imageUrl: "https://picsum.photos/seed/2/600/400",
    liveUrl: "#",
    sourceUrl: "#",
    imageHint: "server database"
  },
  {
    title: "Project Three",
    description: "An exploration into machine learning. I built a model to predict stock prices based on historical data. It was a great learning experience in data science.",
    tags: ["Python", "TensorFlow", "Pandas", "Scikit-learn"],
    imageUrl: "https://picsum.photos/seed/3/600/400",
    liveUrl: "#",
    sourceUrl: "#",
    imageHint: "data chart"
  }
];

const skills = [
  {
    category: "Frontend",
    icon: <Code className="w-8 h-8 text-primary" />,
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux"]
  },
  {
    category: "Backend",
    icon: <Server className="w-8 h-8 text-primary" />,
    technologies: ["Node.js", "Python", "Express", "Firebase", "PostgreSQL"]
  },
  {
    category: "DevOps & Tools",
    icon: <Database className="w-8 h-8 text-primary" />,
    technologies: ["Docker", "Git", "GitHub Actions", "Vercel", "AWS"]
  }
];

export default function PortfolioPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold font-headline">Your Name</h1>
        <nav className="flex items-center gap-4">
          <a href="#projects" className="hover:text-primary transition-colors">Projects</a>
          <a href="#skills" className="hover:text-primary transition-colors">Skills</a>
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </nav>
      </header>

      <main className="container mx-auto px-6">
        {/* Hero Section */}
        <section id="hero" className="text-center py-20 lg:py-32">
          <Image
            src="https://picsum.photos/seed/me/128/128"
            alt="Your Name"
            width={128}
            height={128}
            className="rounded-full mx-auto mb-6 border-4 border-primary shadow-lg"
            data-ai-hint="man portrait"
          />
          <h2 className="font-headline text-4xl md:text-6xl font-bold">
            Software Engineer & Web Developer
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            I build elegant, responsive, and scalable web applications. Currently passionate about [Your Passion] and seeking new opportunities to create and learn.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="#contact">Get in Touch</a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="/resume.pdf" target="_blank">View Resume</a>
            </Button>
          </div>
          <div className="mt-12 flex justify-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary"><Github /></a>
            <a href="#" className="text-muted-foreground hover:text-primary"><Linkedin /></a>
            <a href="#" className="text-muted-foreground hover:text-primary"><Twitter /></a>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20 lg:py-24">
          <h2 className="text-3xl font-headline font-bold text-center mb-12">My Projects</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.title} className="flex flex-col overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={project.imageHint}
                />
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </CardContent>
                <div className="p-6 pt-0 flex gap-4">
                  <Button asChild className="w-full">
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live Demo</a>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Source Code</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Skills Section */}
        <section id="skills" className="py-20 lg:py-24 bg-card rounded-lg">
          <h2 className="text-3xl font-headline font-bold text-center mb-12">Technical Skills</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {skills.map((skill) => (
              <div key={skill.category} className="text-center">
                <div className="flex justify-center items-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                  {skill.icon}
                </div>
                <h3 className="font-headline text-xl font-semibold mb-2">{skill.category}</h3>
                <p className="text-muted-foreground">{skill.technologies.join(', ')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About Me Section */}
        <section id="about" className="py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-headline font-bold mb-4">About Me</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Hello! I'm a Computer Science Engineer with a deep passion for technology and problem-solving. My journey into the world of coding started with a simple "Hello, World!" and has since evolved into a full-blown obsession with building beautiful and functional applications. I thrive in collaborative environments and I'm always eager to learn new technologies and take on challenging projects. When I'm not coding, you can find me exploring the outdoors, reading a good book, or tinkering with my latest hardware project.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 lg:py-24">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline">Get In Touch</CardTitle>
                <p className="text-muted-foreground">Have a question or want to work together? Drop me a message.</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Your Name" />
                    <Input type="email" placeholder="Your Email" />
                  </div>
                  <Textarea placeholder="Your Message" rows={5} />
                  <Button type="submit" className="w-full" size="lg">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Your Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

    