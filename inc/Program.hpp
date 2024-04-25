#pragma once

//ext
#include "external/cpp/inc/GL/glew.h"

namespace ray_tracer
{
	class Shader;
}

namespace ray_tracer
{
	class Program
	{
	public:
		//constructors
		Program(void);

		//destructor
		~Program(void);

		//data
		GLuint id(void) const;
		Shader* vertex_shader(void) const;
		Shader* compute_shader(void) const;
		Shader* geometry_shader(void) const;
		Shader* fragment_shader(void) const;
		Shader* tess_control_shader(void) const;
		Shader* tess_evaluation_shader(void) const;

		//setup
		void setup(void);
		void use(void) const;

		//uniforms
		GLint uniform(const char*);

	private:
		//data
		GLuint m_id;
		Shader* m_vertex_shader;
		Shader* m_compute_shader;
		Shader* m_geometry_shader;
		Shader* m_fragment_shader;
		Shader* m_tess_control_shader;
		Shader* m_tess_evaluation_shader;
	};
}