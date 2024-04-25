#pragma once

namespace ray_tracer
{
	class Program;
}

namespace ray_tracer
{
	class Scene
	{
	public:
		//constructors
		Scene(void);

		//destructor
		~Scene(void);

		//draw
		void draw(void);

	private:
		//setup
		void setup_gl(void);
		void setup_buffers(void);
		void setup_shaders(void);
		
		//buffers
		void buffers_transfer(void);

		//data
		unsigned m_ibo_id;
		unsigned m_vao_id;
		unsigned m_vbo_id;
		Program* m_program;
	};
}