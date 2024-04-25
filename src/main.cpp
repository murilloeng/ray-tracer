//std
#include <string>
#include <cstdio>
#include <cstdlib>

//ext
#include "external/cpp/inc/GL/glew.h"
#include "external/cpp/inc/GL/freeglut.h"

//ray-tracer
#include "ray-tracer-2/inc/Scene.hpp"
#include "ray-tracer-2/inc/Program.hpp"

//data
static unsigned frame = 0;
static ray_tracer::Scene* scene;

//callbacks
static void callback_idle(void)
{
	glUniform1i(glGetUniformLocation(scene->program()->id(), "frame"), frame++);
	glutPostRedisplay();
}
static void callback_display(void)
{
	//clear
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	//draw
	scene->draw();
	//buffers
	glutSwapBuffers();
}
static void callback_reshape(int width, int height)
{
	glViewport(0, 0, width, height);
	glUniform1i(glGetUniformLocation(scene->program()->id(), "width"), width);
	glUniform1i(glGetUniformLocation(scene->program()->id(), "height"), height);
	glutPostRedisplay();
}
static void callback_keyboard(unsigned char key, int x1, int x2)
{
	if(key == 27)
	{
		glutDestroyWindow(glutGetWindow());
	}
}

int main(int argc, char** argv)
{
	//setup
	glutInit(&argc, argv);
	glutInitWindowSize(900, 900);
	glutInitWindowPosition(0, 0);
	glutInitContextVersion(4, 6);
	glutInitContextProfile(GLUT_CORE_PROFILE);
	glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH);
	//window
	glutCreateWindow("Canvas");
	//glew
	if(glewInit() != GLEW_OK)
	{
		fprintf(stderr, "Error: can't setup glew!\n");
		exit(EXIT_FAILURE);
	}
	scene = new ray_tracer::Scene;
	//callbacks
	glutIdleFunc(callback_idle);
	// glutMouseFunc(callback_mouse);
	// glutMotionFunc(callback_motion);
	glutDisplayFunc(callback_display);
	glutReshapeFunc(callback_reshape);
	// glutSpecialFunc(callback_special);
	// glutMouseWheelFunc(callback_wheel);
	glutKeyboardFunc(callback_keyboard);
	//start
	glutFullScreen();
	glutMainLoop();
	//return
	return EXIT_SUCCESS;
}