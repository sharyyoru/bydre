import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');

    let query = supabase
      .from('collage_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error('Error fetching collage projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      workspace_id,
      shape_type,
      shape_name,
      shape_svg_path,
      images,
      settings,
    } = body;

    if (!name || !shape_type || !shape_svg_path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('collage_projects')
      .insert({
        user_id: user.id,
        workspace_id: workspace_id || null,
        name,
        shape_type,
        shape_name: shape_name || null,
        shape_svg_path,
        images: images || [],
        settings: settings || {
          gridRows: 10,
          gridCols: 10,
          padding: 5,
          effect: 'color',
          gradientColors: null,
        },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating collage project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
