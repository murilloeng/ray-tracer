//canvas
#include "ray-tracer-2/inc/Shader.hpp"

namespace ray_tracer
{
	//constructors
	Shader::Shader(GLenum type) : m_id(0), m_type(type)
	{
		return;
	}
	
	//destructor
	Shader::~Shader(void)
	{
		if(glIsShader(m_id)) glDeleteShader(m_id);
	}

	//data
	std::string Shader::path(void) const
	{
		return m_path;
	}
	std::string Shader::path(std::string path)
	{
		return m_path = path;
	}

	//setup
	void Shader::setup(GLuint program_id)
	{
		//check
		if(m_path.empty())
		{
			if(m_type == GL_VERTEX_SHADER || m_type == GL_FRAGMENT_SHADER)
			{
				fprintf(stderr, "Error: %s missing!\n", name());
				exit(EXIT_FAILURE);
			}
			return;
		}
		//source
		if(!load_file())
		{
			fprintf(stderr, "Error loading shader source!\n\tType: %s\n\tPath: %s\n", name(), m_path.c_str());
			exit(EXIT_FAILURE);
		}
		//create
		if((m_id = glCreateShader(m_type)) == 0)
		{
			fprintf(stderr, "Error creating %s!\n", name());
			exit(EXIT_FAILURE);
		}
		//source
		const GLchar* p = m_source.c_str();
		glShaderSource(m_id, 1, &p, nullptr);
		//compile
		GLint status;
		GLchar log[1024];
		glCompileShader(m_id);
		glGetShaderiv(m_id, GL_COMPILE_STATUS, &status);
		if(status == 0)
		{
			glGetShaderInfoLog(m_id, sizeof(log), nullptr, log);
			fprintf(stderr, "Error compiling %s!\nError log: %s\n", name(), log);
			exit(EXIT_FAILURE);
		}
		//attach
		glAttachShader(program_id, m_id);
	}
	bool Shader::load_file(void)
	{
		//open
		FILE* file = fopen(m_path.c_str(), "r");
		//check
		if(!file) return false;
		//read
		m_source.clear();
		while(!feof(file)) m_source += fgetc(file);
		m_source.back() = '\0';
		//close
		fclose(file);
		//return
		return true;
	}

	//name
	const char* Shader::name(void) const
	{
		if(m_type == GL_VERTEX_SHADER) return "Vertex Shader";
		else if(m_type == GL_COMPUTE_SHADER) return "Compute Shader";
		else if(m_type == GL_GEOMETRY_SHADER) return "Geometry Shader";
		else if(m_type == GL_FRAGMENT_SHADER) return "Fragment Shader";
		else if(m_type == GL_TESS_CONTROL_SHADER) return "Tesselation Control Shader";
		else if(m_type == GL_TESS_EVALUATION_SHADER) return "Tesselation Evaluation Shader";
		else return "Invalid shader type!";
	}
}