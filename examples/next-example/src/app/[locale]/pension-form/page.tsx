"use client";

import { DynzCheckbox } from "@/components/dynz/checkbox";
import { DynzDateInput } from "@/components/dynz/date-input";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { DynzNumberInput } from "@/components/dynz/number-input";
import { DynzSelect } from "@/components/dynz/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gender, MaritalStatus, PersonalInfoSchema } from "@/schemas/pension-form";

export default function PensionFormPage() {
  const handleSubmit = (values: unknown) => {
    console.log("Form submitted:", values);
    alert("Formulier verzonden! Check de console voor de data.");
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Pensioen Aanvraag - Stap 1</CardTitle>
          <CardDescription>Persoonlijke gegevens - Vul uw persoonlijke informatie in</CardDescription>
        </CardHeader>
        <CardContent>
          <DynzForm name="pensionPersonalInfo" schema={PersonalInfoSchema} onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Section: Basic Identification */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Identificatie</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DynzInput name="firstName" type="text" />
                  <DynzInput name="middleName" type="text" />
                  <DynzInput name="lastName" type="text" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DynzInput name="bsn" type="text" />
                  <DynzDateInput name="dateOfBirth" />
                </div>

                <DynzSelect name="gender" options={Object.values(Gender)} />
              </div>

              {/* Section: Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Contactgegevens</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DynzInput name="email" type="email" />
                  <DynzInput name="phoneNumber" type="tel" />
                </div>
              </div>

              {/* Section: Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Adres</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DynzInput name="postalCode" type="text" />
                  <DynzInput name="houseNumber" type="text" />
                  <DynzInput name="houseNumberAddition" type="text" />
                </div>
              </div>

              {/* Section: Marital Status & Partner */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Burgerlijke staat</h3>

                <DynzSelect name="maritalStatus" options={Object.values(MaritalStatus)} />

                {/* Partner fields - conditionally shown based on maritalStatus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DynzDateInput name="partnerDateOfBirth" />
                  <DynzInput name="partnerBsn" type="text" />
                </div>
              </div>

              {/* Section: Children */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Kinderen</h3>

                <DynzCheckbox name="hasChildrenUnder21" />

                {/* Conditionally shown when hasChildrenUnder21 is true */}
                <DynzNumberInput name="numberOfChildrenUnder21" />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg">
                  Volgende stap →
                </Button>
              </div>
            </div>
          </DynzForm>
        </CardContent>
      </Card>
    </div>
  );
}
