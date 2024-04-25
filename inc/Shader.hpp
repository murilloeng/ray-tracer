#pragma once

//std
#include <string>

//ext
#include "external/cpp/inc/GL/glew.h"

namespace ray_tracer
{
	class Shader
	{
	public:
		//constructors
		Shader(GLenum);

		//constructors
		~Shader(void);

		//data
		std::string path(void) const;
		std::string path(std::string);

		//setup
		void setup(GLuint);
		bool load_file(void);

		//name
		const char* name(void) const;

	private:
		//data
		GLuint m_id;
		GLenum m_type;
		std::string m_path;
		std::string m_source;
	};
}