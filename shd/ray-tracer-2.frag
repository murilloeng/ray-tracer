#version 460 core

//define
#define t_min 1e-3
#define PI 3.141592654
#define reflections_max 16

//uniforms
uniform int frame;
uniform int width;
uniform int height;
out vec4 fragment_color;

//structs
struct Ray
{
	vec3 m_origin;
	vec3 m_direction;
};
struct Camera
{
	float m_fov;
	vec3 m_target;
	vec3 m_position;
	vec3 m_vertical;
};
struct Material
{
	vec3 m_color;
	float m_roughness;
};
struct Hit
{
	float m_t;
	vec3 m_point;
	vec3 m_normal;
	Material m_material;
};

//objects
struct Plane
{
	vec3 m_point;
	vec3 m_normal;
	Material m_material;
};
struct Board
{
	vec3 m_point;
	vec3 m_normal;
	Material m_material_1;
	Material m_material_2;
};
struct Sphere
{
	vec3 m_center;
	float m_radius;
	Material m_material;
};

//lights
struct Light_Ambient
{
	vec3 m_color;
	float m_intensity;
};
struct Light_Point
{
	vec3 m_color;
	vec3 m_position;
	float m_intensity;
};
struct Light_Direction
{
	vec3 m_color;
	vec3 m_direction;
	float m_intensity;
};

//data
int n_planes;
int n_boards;
int n_spheres;
int n_lights_point;
int n_lights_ambient;
int n_lights_direction;

const int scene_index = 0;
const int n_boards_max = 10;
const int n_planes_max = 10;
const int n_spheres_max = 10;
const int n_lights_point_max = 10;
const int n_lights_ambient_max = 10;
const int n_lights_direction_max = 10;

Camera camera;
Plane planes[n_planes_max];
Board boards[n_boards_max];
Sphere spheres[n_spheres_max];
Light_Point lights_point[n_lights_point_max];
Light_Ambient lights_ambient[n_lights_ambient_max];
Light_Direction lights_direction[n_lights_direction_max];

//scenes
void scene_1(void)
{
	//data
	n_planes = 0;
	n_boards = 1;
	n_spheres = 1;
	n_lights_point = 1;
	n_lights_ambient = 1;
	n_lights_direction = 1;
	//camera
	camera.m_fov = PI / 2;
	camera.m_target = vec3(0, 0, -1);
	camera.m_position = vec3(0, 0, 0);
	camera.m_vertical = vec3(0, 1, 0);
	//materials
	Material sphere_material = Material(vec3(0, 0, 1), 0);
	Material board_material_1 = Material(vec3(0, 0, 0), 0);
	Material board_material_2 = Material(vec3(1, 1, 1), 0);
	//objects
	spheres[0] = Sphere(vec3(0, 0, -2), 0.5, sphere_material);
	boards[0] = Board(vec3(0, -1, 0), vec3(0, 1, 0), board_material_1, board_material_2);
	//lights
	float t = frame / 40.0;
	lights_ambient[0] = Light_Ambient(vec3(1, 1, 1), 0.1);
	lights_direction[0] = Light_Direction(vec3(1, 1, 1), -vec3(cos(t), sin(t), 0), 1);
	lights_point[0] = Light_Point(vec3(1, 1, 1), vec3(3, 3, -2), sin(t) < 0 ? 100 : 0);
}
void scene_2(void)
{
	//data
	n_planes = 0;
	n_boards = 0;
	n_spheres = 0;
	n_lights_point = 0;
	n_lights_ambient = 0;
	n_lights_direction = 0;
}
void setup_scene(void)
{
	if(scene_index == 0) scene_1();
	if(scene_index == 1) scene_2();
}

//intersections
bool hit_plane(Ray ray, Plane plane, inout Hit hit)
{
	//ray
	vec3 ro = ray.m_origin;
	vec3 rd = ray.m_direction;
	//plane
	vec3 px = plane.m_point;
	vec3 pn = plane.m_normal;
	//parallel
	if(abs(dot(rd, pn)) < 1e-5) return false;
	//plane hit
	float t = dot(px - ro, pn) / dot(rd, pn);
	hit = Hit(t, ro + t * rd, pn, plane.m_material);
	//return
	return t > t_min;
}
bool hit_board(Ray ray, Board board, inout Hit hit)
{
	if(hit_plane(ray, Plane(board.m_point, board.m_normal, board.m_material_1), hit))
	{
		bool test_1 = fract(hit.m_point[0]) < 0.5 && fract(hit.m_point[2]) < 0.5;
		bool test_2 = fract(hit.m_point[0]) > 0.5 && fract(hit.m_point[2]) > 0.5;
		if(test_1 || test_2) hit.m_material = board.m_material_2;
		return true;
	}
	else
	{
		return false;
	}
}
bool hit_sphere(Ray ray, Sphere sphere, inout Hit hit)
{
	//ray
	vec3 ro = ray.m_origin;
	vec3 rd = ray.m_direction;
	//sphere
	vec3 sc = sphere.m_center;
	float sr = sphere.m_radius;
	//sphere check
	float b = 2 * dot(rd, ro - sc);
	float c = dot(ro - sc, ro - sc) - sr * sr;
	float d = b * b - 4 * c;
	if(d < 0) return false;
	//sphere check
	float t1 = (-b - sqrt(d)) / 2;
	float t2 = (-b + sqrt(d)) / 2;
	if(t1 < t_min && t2 < t_min) return false;
	//sphere hit
	float t = t1 > t_min ? t1 : t2;
	hit = Hit(t, ro + t * rd, normalize(ro + t * rd - sc), sphere.m_material);
	//return
	return true;
}

//ray intersection
void ray_intersection_planes(Ray ray, inout Hit hit, inout bool test)
{
	Hit object_hit;
	for(int i = 0; i < n_planes; i++)
	{
		if(hit_plane(ray, planes[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
}
void ray_intersection_boards(Ray ray, inout Hit hit, inout bool test)
{
	Hit object_hit;
	for(int i = 0; i < n_boards; i++)
	{
		if(hit_board(ray, boards[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
}
void ray_intersection_spheres(Ray ray, inout Hit hit, inout bool test)
{
	Hit object_hit;
	for(int i = 0; i < n_spheres; i++)
	{
		if(hit_sphere(ray, spheres[i], object_hit))
		{
			if(!test || hit.m_t > object_hit.m_t)
			{
				hit = object_hit;
			}
			test = true;
		}
	}
}
bool ray_intersection(Ray ray, out Hit hit)
{
	//data
	Hit object_hit;
	bool test = false;
	//objects
	ray_intersection_boards(ray, hit, test);
	ray_intersection_planes(ray, hit, test);
	ray_intersection_spheres(ray, hit, test);
	//return
	return test;
}

//ray illumination
void ray_illumination_point(Ray ray, inout vec3 color)
{
	Hit hit, hit_shadow;
	if(ray_intersection(ray, hit))
	{
		for(int light_index = 0; light_index < n_lights_point; light_index++)
		{
			vec3 light_color = lights_point[light_index].m_color;
			vec3 light_position = lights_point[light_index].m_position;
			vec3 light_direction = normalize(light_position - hit.m_point);
			float light_intensity = lights_point[light_index].m_intensity / pow(length(light_position - hit.m_point), 2);
			if(dot(hit.m_normal, light_direction) > 0 && !ray_intersection(Ray(hit.m_point, light_direction), hit_shadow))
			{
				color += light_intensity * light_color * hit.m_material.m_color * dot(hit.m_normal, light_direction);
			}
		}
	}
}
void ray_illumination_ambient(Ray ray, inout vec3 color)
{
	Hit hit;
	if(ray_intersection(ray, hit))
	{
		for(int light_index = 0; light_index < n_lights_ambient; light_index++)
		{
			color += lights_ambient[light_index].m_intensity * lights_ambient[light_index].m_color * hit.m_material.m_color;
		}
	}
}
void ray_illumination_direction(Ray ray, inout vec3 color)
{
	Hit hit, hit_shadow;
	if(ray_intersection(ray, hit))
	{
		for(int light_index = 0; light_index < n_lights_direction; light_index++)
		{
			vec3 light_color = lights_direction[light_index].m_color;
			vec3 light_direction = lights_direction[light_index].m_direction;
			float light_intensity = lights_direction[light_index].m_intensity;
			if(dot(hit.m_normal, -light_direction) > 0 && !ray_intersection(Ray(hit.m_point, -light_direction), hit_shadow))
			{
				color += light_intensity * light_color * hit.m_material.m_color * dot(hit.m_normal, -light_direction);
			}
		}
	}
}
vec3 ray_illumination(Ray ray)
{
	//data
	Hit hit, hit_shadow;
	vec3 color = vec3(0);
	//illumination
	ray_illumination_point(ray, color);
	ray_illumination_ambient(ray, color);
	ray_illumination_direction(ray, color);
	//return
	return color;
}

void main(void)
{
	//pixel
	setup_scene();
	vec3 pixel_position;
	pixel_position[2] = -1 / tan(camera.m_fov / 2);
	pixel_position[0] = (2 * gl_FragCoord.x - width) / height;
	pixel_position[1] = (2 * gl_FragCoord.y - height) / height;
	//ray
	Ray ray = Ray(camera.m_position, normalize(pixel_position));
	//fragment
	fragment_color = vec4(ray_illumination(ray), 1);
}