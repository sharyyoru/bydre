import { BuildCard } from "./build-card"

type Model = {
  id: string
  slug: string
  title: string
  title_fr?: string
  short_description: string
  short_description_fr?: string
  price_aed: number
  piece_count: number
  complexity_level: "beginner" | "intermediate" | "advanced" | "expert"
  category: string
  category_fr?: string
  image_url: string
  stock_status: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
}

interface FeaturedBuildsProps {
  models: Model[]
  locale: "en" | "fr"
  dict: {
    featured: {
      title: string
      subtitle: string
      pieces: string
      viewDetails: string
      complexity: Record<string, string>
      stock: Record<string, string>
    }
  }
}

export function FeaturedBuilds({ models, locale, dict }: FeaturedBuildsProps) {
  return (
    <section id="collection" className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            {dict.featured.title}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {dict.featured.subtitle}
          </p>
        </div>

        {/* Grid - Mobile first: 1 col, sm: 2 cols, lg: 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <BuildCard
              key={model.id}
              model={model}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
