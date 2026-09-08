import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { blogPosts } from '@/lib/sei/blog-data';
import { Header } from '@/components/sei/Header';
import { Footer } from '@/components/sei/Footer';

export const metadata = {
  title: 'Blog | SEI Saadiyat',
  description: 'Insights and guides about Saadiyat Island real estate investment.',
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Insights & Guides</p>
            <h1 className="text-4xl md:text-5xl text-[#0a0a0a] font-light mb-6">SEI Saadiyat <span className="font-semibold">Blog</span></h1>
            <p className="text-gray-600 text-lg">Expert knowledge on Saadiyat Island real estate and investment opportunities.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/sei/blog/${post.slug}`} className="group">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#c9a962] text-black text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-[#0a0a0a] group-hover:text-[#c9a962] transition-colors mb-2">{post.title}</h2>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</span>
                  <span className="text-[#c9a962] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Read More <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
