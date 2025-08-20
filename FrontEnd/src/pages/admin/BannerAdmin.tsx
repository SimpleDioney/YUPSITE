import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/services/api";

interface Banner {
  id: number;
  title: string;
  photo: string;
  type: "normal" | "celular";
  is_active: number;
  created_at: string;
}

export function BannerAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [photoNormal, setPhotoNormal] = useState<File | null>(null);
  const [photoNormalPreview, setPhotoNormalPreview] = useState<string | null>(null);
  const [photoCelular, setPhotoCelular] = useState<File | null>(null);
  const [photoCelularPreview, setPhotoCelularPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBanners = () => {
    setLoading(true);
    api
      .get("/banners/all")
      .then((res) => setBanners(res.data))
      .catch((err) => {
        console.error("Erro ao buscar banners:", err);
        setError(
          "Não foi possível carregar os banners. Verifique se você está logado como administrador."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !photoNormal || !photoCelular) {
      alert("Preencha o título e selecione as duas imagens (normal e celular).");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("photo_normal", photoNormal);
    formData.append("photo_celular", photoCelular);

    try {
      await api.post("/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setTitle("");
      setPhotoNormal(null);
      setPhotoNormalPreview(null);
      setPhotoCelular(null);
      setPhotoCelularPreview(null);

      const normalInput = document.getElementById("photo-normal") as HTMLInputElement;
      const celularInput = document.getElementById("photo-celular") as HTMLInputElement;
      if (normalInput) normalInput.value = "";
      if (celularInput) celularInput.value = "";

      fetchBanners();
    } catch (err) {
      console.error("Erro ao criar banners:", err);
      setError("Ocorreu um erro ao enviar os banners.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja remover este banner?")) return;

    try {
      await api.delete(`/banners/${id}`);
      fetchBanners();
    } catch (err) {
      console.error("Erro ao deletar banner:", err);
      setError("Não foi possível remover o banner.");
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.patch(`/banners/${id}/toggle`);
      fetchBanners();
    } catch (err) {
      console.error("Erro ao alterar status do banner:", err);
      setError("Não foi possível alterar o status do banner.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gerenciar Banners</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 bg-white rounded-lg shadow-md">
        <input
          type="text"
          placeholder="Título do Banner"
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem para Desktop (1366x500)</label>
          <div className="space-y-2">
            <input
              id="photo-normal"
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/gif"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPhotoNormal(e.target.files[0]);
                  setPhotoNormalPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {photoNormalPreview && (
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photoNormalPreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoNormal(null);
                    setPhotoNormalPreview(null);
                    const input = document.getElementById('photo-normal') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem para Celular (proporção vertical)</label>
          <div className="space-y-2">
            <input
              id="photo-celular"
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/gif"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPhotoCelular(e.target.files[0]);
                  setPhotoCelularPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {photoCelularPreview && (
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photoCelularPreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoCelular(null);
                    setPhotoCelularPreview(null);
                    const input = document.getElementById('photo-celular') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold"
          type="submit"
        >
          Adicionar Banner
        </button>
      </form>

      <div className="space-y-4">
        {loading && <p>Carregando banners...</p>}
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center justify-between bg-white border p-4 rounded-lg shadow-sm">
            <img
              src={`http://localhost:3000/uploads/banners/${banner.photo}`}
              alt={banner.title}
              className="w-40 h-auto object-cover rounded-md"
            />
            <div className="flex-grow mx-4">
              <h3 className="font-semibold text-lg text-gray-900">{banner.title}</h3>
              <p className="text-sm text-gray-500 capitalize">Tipo: {banner.type}</p>
              <span
                className={`px-2 mt-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  banner.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {banner.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium text-white ${
                  banner.is_active ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
                }`}
                onClick={() => handleToggleActive(banner.id)}
              >
                {banner.is_active ? "Desativar" : "Ativar"}
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700"
                onClick={() => handleDelete(banner.id)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
