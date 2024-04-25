//canvas
#include "ray-tracer-2/inc/Shader.hpp"
#include "ray-tracer-2/inc/Program.hpp"

namespace ray_tracer
{
	//constructors
	Program::Program(void) : m_id(0), 
		m_vertex_shader(new Shader(GL_VERTEX_SHADER)),
		m_compute_shader(new Shader(GL_COMPUTE_SHADER)),
		m_geometry_shader(new Shader(GL_GEOMETRY_SHADER)),
		m_fragment_shader(new Shader(GL_FRAGMENT_SHADER)),
		m_tess_control_shader(new Shader(GL_TESS_CONTROL_SHADER)),
		m_tess_evaluation_shader(new Shader(GL_TESS_EVALUATION_SHADER))
	{
		return;
	}

	//destructor
	Program::~Program(void)
	{
		delete m_vertex_shader;
		delete m_compute_shader;
		delete m_geometry_shader;
		delete m_fragment_shader;
		delete m_tess_control_shader;
		delete m_tess_evaluation_shader;
		if(glIsProgram(m_id)) glDeleteProgram(m_id);
	}

	//data
	GLuint Program::id(void) const
	{
		return m_id;
	}
	Shader* Program::vertex_shader(void) const
	{
		return m_vertex_shader;
	}
	Shader* Program::compute_shader(void) const
	{
		return m_compute_shader;
	}
	Shader* Program::geometry_shader(void) const
	{
		return m_geometry_shader;
	}
	Shader* Program::fragment_shader(void) const
	{
		return m_fragment_shader;
	}
	Shader* Program::tess_control_shader(void) const
	{
		return m_tess_control_shader;
	}
	Shader* Program::tess_evaluation_shader(void) const
	{
		return m_tess_evaluation_shader;
	}

	//setup
	void Program::setup(void)
	{
		//create
		if((m_id = glCreateProgram()) == 0)
		{
			fprintf(stderr, "Error creating shader program!\n");
			exit(EXIT_FAILURE);
		}
		//shaders
		m_vertex_shader->setup(m_id);
		m_compute_shader->setup(m_id);
		m_geometry_shader->setup(m_id);
		m_fragment_shader->setup(m_id);
		m_tess_control_shader->setup(m_id);
		m_tess_evaluation_shader->setup(m_id);
		//link
		GLint status;
		GLchar log[1024];
		glLinkProgram(m_id);
		glGetProgramiv(m_id, GL_LINK_STATUS, &status);
		if(status == 0)
		{
			glGetProgramInfoLog(m_id, sizeof(log), nullptr, log);
			fprintf(stderr, "Error linking shader program: %s\n", log);
			exit(EXIT_FAILURE);
		}
		//validate
		glValidateProgram(m_id);
		glGetProgramiv(m_id, GL_VALIDATE_STATUS, &status);
		if(status == 0)
		{
			glGetProgramInfoLog(m_id, sizeof(log), nullptr, log);
			fprintf(stderr, "Error validating shader program: %s\n", log);
			exit(EXIT_FAILURE);
		}
	}
	void Program::use(void) const
	{
		glUseProgram(m_id);
	}

	//uniforms
	GLint Program::uniform(const char* uniform)
	{
		//uniform
		GLint location = glGetUniformLocation(m_id, uniform);
		//check
		GLenum last_error = glGetError();
		if(location == -1 || last_error != GL_NO_ERROR)
		{
			printf("Error getting uniform %s location!\n", uniform);
			exit(EXIT_FAILURE);
		}
		//return
		return location;
	}
}