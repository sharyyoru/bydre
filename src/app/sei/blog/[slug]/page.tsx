import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { getBlogPost, blogPosts } from '@/lib/sei/blog-data';
import { Header } from '@/components/sei/Header';
import { Footer } from '@/components/sei/Footer';
import { RegistrationForm } from '@/components/sei/RegistrationForm';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} | SEI Saadiyat Blog`,
    description: post.excerpt,
  };
}

function formatContent(content: string): string {
  return content
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-600">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
    .replace(/\|.*\|/g, (match) => `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse">${match}</table></div>`);
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white">
        <article className="container mx-auto px-4 max-w-4xl">
          <Link href="/sei/blog" className="inline-flex items-center gap-2 text-[#c9a962] font-medium mb-8 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <div className="relative aspect-[2/1] rounded-2xl overflow-hidden mb-8">
            <Image src={post.image} alt={post.title} fill className="object-cover" priority />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="bg-[#c9a962] text-black text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
            <span className="flex items-center gap-1 text-gray-500 text-sm"><Calendar className="w-4 h-4" />{post.date}</span>
            <span className="flex items-center gap-1 text-gray-500 text-sm"><Clock className="w-4 h-4" />{post.readTime}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{post.title}</h1>

          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: `<p class="text-gray-600 leading-relaxed mb-4">${formatContent(post.content)}</p>` }} />

          <div className="mt-16 bg-[#0a0a0a] rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Interested in SEI Saadiyat?</h3>
            <p className="text-white/60 mb-6">Register your interest to receive exclusive pricing and floor plans.</p>
            <div className="bg-white rounded-xl p-6">
              <RegistrationForm />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
