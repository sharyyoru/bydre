'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { blogPosts } from '@/lib/sei/blog-data';
import { useSectionTracking } from '@/hooks/sei/useTracking';

export function FeaturedArticles() {
  const trackRef = useSectionTracking('featured_articles');
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <section ref={trackRef} className="py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Insights & Guides</p>
            <h2 className="text-4xl md:text-5xl text-[#0a0a0a] font-light">Expert <span className="font-semibold">Knowledge</span></h2>
          </div>
          <Link href="/sei/blog" className="inline-flex items-center gap-2 text-[#c9a962] font-semibold hover:gap-3 transition-all">
            View All Articles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Link href={`/sei/blog/${featuredPosts[0].slug}`} className="group block">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6">
                <Image src={featuredPosts[0].image} alt={featuredPosts[0].title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block bg-[#c9a962] text-black text-xs font-semibold px-3 py-1 rounded-full mb-3">{featuredPosts[0].category}</span>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white group-hover:text-[#c9a962] transition-colors">{featuredPosts[0].title}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{featuredPosts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{featuredPosts[0].readTime}</span>
                <span className="text-[#c9a962] font-medium group-hover:underline">Read More →</span>
              </div>
            </Link>
          </div>

          <div className="space-y-6">
            {featuredPosts.slice(1, 3).map((post) => (
              <Link key={post.slug} href={`/sei/blog/${post.slug}`} className="group flex gap-4">
                <div className="relative w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[#c9a962] text-xs font-semibold uppercase tracking-wider">{post.category}</span>
                  <h4 className="font-semibold text-[#0a0a0a] group-hover:text-[#c9a962] transition-colors line-clamp-2 mt-1">{post.title}</h4>
                  <span className="text-gray-500 text-sm flex items-center gap-1 mt-2"><Clock className="w-3 h-3" />{post.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
