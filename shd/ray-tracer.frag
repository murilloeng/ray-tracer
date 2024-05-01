#version 460 core

uniform int frame;
uniform int width;
uniform int height;
out vec4 fragment_color;

struct Ray
{
	vec3 m_origin;
	vec3 m_direction;
};
struct Light
{
	vec3 m_color;
	vec3 m_position;
};
struct Material
{
	vec3 m_color;
	bool m_metalic;
	float m_roughness;
};
struct Hit
{
	float m_t;
	vec3 m_point;
	vec3 m_normal;
	int m_object_id;
	Material m_material;
};
struct Plane
{
	int m_id;
	vec3 m_point;
	vec3 m_normal;
	Material m_material;
};
struct Board
{
	int m_id;
	vec3 m_point;
	vec3 m_normal;
	Material m_material_1;
	Material m_material_2;
};
struct Sphere
{
	int m_id;
	vec3 m_center;
	float m_radius;
	Material m_material;
};

const int nl_max = 10;
const int ns_max = 10;
const int np_max = 10;
const int nc_max = 10;
const int scene_index = 0;

int nl;
int np;
int nb;
int ns;
Light light_ambient;
Light lights[nl_max];
Plane planes[np_max];
Board boards[nc_max];
Sphere spheres[ns_max];

const float t_min = 1e-5;
const float focal_length = 1;
const float pi = 3.141592654;
const int reflection_max = 16;
const vec3 camera_position = vec3(0);

void scene_1(void)
{
	//data
	nl = 1;
	np = 0;
	nb = 1;
	ns = 3;
	Material board_material_1 = Material(vec3(0), false, 0.2);
	Material board_material_2 = Material(vec3(1), false, 0.2);
	Material sphere_material_1 = Material(vec3(1, 0, 0), false, 0.5);
	Material sphere_material_2 = Material(vec3(0, 1, 0), false, 0.5);
	Material sphere_material_3 = Material(vec3(0, 0, 1), false, 0.5);
	//lights
	light_ambient = Light(0.2 * vec3(1, 1, 1), vec3(0));
	lights[0] = Light(100 * vec3(1, 1, 1), vec3(4 * sin(frame / 1000.0), 1, -2));
	//spheres
	spheres[0] = Sphere(0, vec3(-2, 0, -2), 0.5, sphere_material_1);
	spheres[1] = Sphere(1, vec3(+0, 0, -2), 0.5, sphere_material_2);
	spheres[2] = Sphere(2, vec3(+2, 0, -2), 0.5, sphere_material_3);
	//boards
	boards[0] = Board(3, vec3(0, -1, 0), vec3(0, 1, 0), board_material_1, board_material_2);
}
void scene_2(void)
{
	//data
	nl = 1;
	np = 0;
	nb = 0;
	ns = 1;
	//lights
	light_ambient = Light(0 * vec3(1, 1, 1), vec3(0));
	lights[0] = Light(2 * vec3(1, 1, 1), vec3(sin(frame / 20.0), 0, cos(frame / 20.0) - 2));
	//spheres
	spheres[0] = Sphere(0, vec3(0, 0, -2), 0.5, Material(vec3(0, 0, 1), false, 0.8));
	//planes
	planes[0] = Plane(1, vec3(0, -1, 0), vec3(0, 1, 0), Material(vec3(0.5, 0.5, 0.5), false, 0.2));
}
void scene(void)
{
	if(scene_index == 0) scene_1();
	if(scene_index == 1) scene_2();
}

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
	hit = Hit(t, ro + t * rd, pn, plane.m_id, plane.m_material);
	//return
	return t > t_min;
}
bool hit_board(Ray ray, Board board, inout Hit hit)
{
	if(hit_plane(ray, Plane(board.m_id, board.m_point, board.m_normal, board.m_material_1), hit))
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
	hit = Hit(t, ro + t * rd, normalize(ro + t * rd - sc), sphere.m_id, sphere.m_material);
	//return
	return true;
}

//PBR
float normal_distribution(float alpha, vec3 N, vec3 H)
{
	float a2 = alpha * alpha;
	float dNH2 = pow(max(dot(N, H), 0), 2);
	return a2 / pi / pow(1 - (1 - a2) * dNH2, 2);
}
float shadowing(float alpha, vec3 N, vec3 X)
{
	float k = alpha / 2;
	float dNX = max(dot(N, X), 0);
	return dNX / (k + (1 - k) * dNX);
}
float shadowing(float alpha, vec3 N, vec3 V, vec3 L)
{
	return shadowing(alpha, N, V) * shadowing(alpha, N, L);
}
vec3 fresnel(vec3 F0, vec3 V, vec3 H)
{
	float dVH = max(dot(V, H), 0);
	return F0 + (vec3(1) - F0) * pow(1 - dVH, 5);
}

bool ray_intersection(Ray ray, inout Hit hit)
{
	//data
	Hit object_hit;
	bool test = false;
	//objects
	for(int i = 0; i < ns; i++)
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
	for(int i = 0; i < np; i++)
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
	for(int i = 0; i < nb; i++)
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
	//return
	return test;
}
vec3 ray_color(Ray ray)
{
	//data
	Hit hit, hit_shadow;
	vec3 color = vec3(0);
	//color
	if(ray_intersection(ray, hit))
	{
		//lights
		for(int i = 0; i < nl; i++)
		{
			//data
			vec3 N = hit.m_normal;
			vec3 V = normalize(camera_position - hit.m_point);
			vec3 L = normalize(lights[i].m_position - hit.m_point);
			//PBR model
			vec3 H = normalize(L + V);
			float dNV = max(dot(N, V), 0);
			float dNL = max(dot(N, L), 0);
			vec3 F = fresnel(hit.m_material.m_color, V, H);
			float d = length(lights[i].m_position - hit.m_point);
			float G = shadowing(hit.m_material.m_roughness, N, V, L);
			float D = normal_distribution(hit.m_material.m_roughness, N, H);
			//PBR diffuse
			vec3 ks = F;
			vec3 kd = 1 - F;
			bool bd = !hit.m_material.m_metalic;
			vec3 fs = vec3(D * G / 4 / dNV / dNL);
			vec3 fd = hit.m_material.m_color / pi;
			//shadow
			if((!ray_intersection(Ray(hit.m_point, L), hit_shadow) || hit_shadow.m_t > d) && dot(N, L) > 0)
			{
				color += (int(bd) * kd * fd + ks * fs) * lights[i].m_color / d / d * dot(N, L);
			}
		}
		//ambient
		color += light_ambient.m_color * hit.m_material.m_color;
	}
	//return
	return color;
}

void main(void)
{
	//pixel
	vec3 pixel_position;
	pixel_position[2] = -focal_length;
	pixel_position[0] = (2 * gl_FragCoord.x - width) / height;
	pixel_position[1] = (2 * gl_FragCoord.y - height) / height;
	//ray
	scene();
	Ray ray = Ray(camera_position, normalize(pixel_position - camera_position));
	//fragment
	fragment_color = vec4(ray_color(ray), 1);
}